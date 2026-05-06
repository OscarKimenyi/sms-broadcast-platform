require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const redis = require('../config/redis');
const db = require('../config/db');
const AfricasTalking = require('africastalking');
const emailService = require('../services/email.service');

const AT = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
});
const sms = AT.SMS;
const BATCH_SIZE = 100;

// Replace {{first_name}}, {{last_name}}, {{phone}} merge tags
function personalize(template, contact) {
    return template
        .replace(/\{\{first_name\}\}/gi, contact.first_name || 'Customer')
        .replace(/\{\{last_name\}\}/gi, contact.last_name || '')
        .replace(/\{\{phone\}\}/gi, contact.phone_number || '');
}

const worker = new Worker('campaign', async (job) => {
    const { campaignId } = job.data;
    console.log(`Processing campaign ${campaignId}`);

    const [campaigns] = await db.query(
        `SELECT c.*, s.sender_name FROM campaigns c
     LEFT JOIN sender_ids s ON c.sender_id = s.id
     WHERE c.id = ?`,
        [campaignId]
    );
    if (!campaigns.length) throw new Error('Campaign not found');
    const campaign = campaigns[0];

    await db.query(`UPDATE campaigns SET status = 'sending', sent_at = NOW() WHERE id = ?`, [campaignId]);

    const [contacts] = await db.query(
        `SELECT id, phone_number, first_name, last_name
     FROM contacts WHERE list_id = ? AND status = 'active'`,
        [campaign.list_id]
    );

    if (!contacts.length) {
        await db.query(`UPDATE campaigns SET status = 'sent' WHERE id = ?`, [campaignId]);
        return;
    }

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
        const batch = contacts.slice(i, i + BATCH_SIZE);

        // Check if message has merge tags — if so, send individually
        const hasMergeTags = /\{\{(first_name|last_name|phone)\}\}/i.test(campaign.message_body);

        try {
            if (hasMergeTags) {
                // Send one by one for personalization
                for (const contact of batch) {
                    const personalizedMsg = personalize(campaign.message_body, contact);
                    try {
                        const res = await sms.send({
                            to: [contact.phone_number],
                            message: personalizedMsg,
                            from: campaign.sender_name || undefined,
                        });
                        const result = res.SMSMessageData.Recipients[0];
                        const success = result.statusCode === 101;

                        await db.query(
                            `INSERT INTO sms_logs (campaign_id, contact_id, phone_number, status, gateway_message_id, sent_at)
               VALUES (?, ?, ?, ?, ?, NOW())`,
                            [campaignId, contact.id, contact.phone_number, success ? 'sent' : 'failed', result.messageId || null]
                        );
                        if (success) sentCount++; else failedCount++;
                    } catch { failedCount++; }
                    await new Promise(r => setTimeout(r, 100));
                }
            } else {
                // Batch send for identical messages
                const numbers = batch.map(c => c.phone_number);
                const response = await sms.send({
                    to: numbers,
                    message: campaign.message_body,
                    from: campaign.sender_name || undefined,
                });

                for (const result of response.SMSMessageData.Recipients) {
                    const contact = batch.find(c => c.phone_number === result.number);
                    const success = result.statusCode === 101;

                    await db.query(
                        `INSERT INTO sms_logs (campaign_id, contact_id, phone_number, status, gateway_message_id, sent_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
                        [campaignId, contact?.id || null, result.number, success ? 'sent' : 'failed', result.messageId || null]
                    );
                    if (success) sentCount++; else failedCount++;
                }
            }
        } catch (batchErr) {
            console.error(`Batch error:`, batchErr.message);
            for (const contact of batch) {
                await db.query(
                    `INSERT INTO sms_logs (campaign_id, contact_id, phone_number, status, sent_at)
           VALUES (?, ?, ?, 'failed', NOW())`,
                    [campaignId, contact.id, contact.phone_number]
                );
                failedCount++;
            }
        }

        await db.query(
            `UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?`,
            [sentCount, failedCount, campaignId]
        );
        await new Promise(r => setTimeout(r, 500));
    }

    // Mark complete
    await db.query(`UPDATE campaigns SET status = 'sent' WHERE id = ?`, [campaignId]);

    // Deduct credits
    await db.query(`UPDATE users SET sms_credits = sms_credits - ? WHERE id = ?`, [sentCount, campaign.user_id]);
    await db.query(
        `INSERT INTO credit_transactions (user_id, credits_change, type, reference, description)
     VALUES (?, ?, 'spend', ?, ?)`,
        [campaign.user_id, -sentCount, `campaign_${campaignId}`, `Campaign: ${campaign.name}`]
    );

    // Send completion email + check low credits
    const [[user]] = await db.query(
        'SELECT id, name, email, sms_credits, email_notifications, low_credit_threshold FROM users WHERE id = ?',
        [campaign.user_id]
    );

    const updatedCampaign = { ...campaign, sent_count: sentCount, delivered_count: 0, failed_count: failedCount, total_recipients: contacts.length };

    if (user.email_notifications) {
        emailService.sendCampaignComplete(user, updatedCampaign);
        if (user.sms_credits <= (user.low_credit_threshold || 100)) {
            emailService.sendLowCreditAlert(user);
        }
    }

    console.log(`Campaign ${campaignId} done. Sent: ${sentCount}, Failed: ${failedCount}`);
}, { connection: redis, concurrency: 2 });

// Handle opt-out from inbound SMS
worker.on('completed', job => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message));

console.log('SMS Worker running...');