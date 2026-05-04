require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const redis = require('../config/redis');
const db = require('../config/db');
const AfricasTalking = require('africastalking');

const AT = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
});
const sms = AT.SMS;

const BATCH_SIZE = 100;

const worker = new Worker(
    'campaign',
    async (job) => {
        const { campaignId } = job.data;
        console.log(`Processing campaign ${campaignId}`);

        // Fetch campaign details
        const [campaigns] = await db.query(
            `SELECT c.*, sl.sender_name FROM campaigns c
       LEFT JOIN sender_ids sl ON c.sender_id = sl.id
       WHERE c.id = ?`,
            [campaignId]
        );
        if (!campaigns.length) throw new Error('Campaign not found');
        const campaign = campaigns[0];

        // Update campaign status to sending
        await db.query(`UPDATE campaigns SET status = 'sending', sent_at = NOW() WHERE id = ?`, [campaignId]);

        // Fetch all active contacts in the list
        const [contacts] = await db.query(
            `SELECT id, phone_number FROM contacts WHERE list_id = ? AND status = 'active'`,
            [campaign.list_id]
        );

        if (!contacts.length) {
            await db.query(`UPDATE campaigns SET status = 'sent' WHERE id = ?`, [campaignId]);
            return;
        }

        let sentCount = 0;
        let failedCount = 0;

        // Process in batches
        for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
            const batch = contacts.slice(i, i + BATCH_SIZE);
            const numbers = batch.map((c) => c.phone_number);

            try {
                const response = await sms.send({
                    to: numbers,
                    message: campaign.message_body,
                    from: campaign.sender_name || undefined,
                });

                const results = response.SMSMessageData.Recipients;

                for (const result of results) {
                    const contact = batch.find((c) => c.phone_number === result.number);
                    const success = result.statusCode === 101;

                    // Insert SMS log
                    await db.query(
                        `INSERT INTO sms_logs (campaign_id, contact_id, phone_number, status, gateway_message_id, sent_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
                        [
                            campaignId,
                            contact ? contact.id : null,
                            result.number,
                            success ? 'sent' : 'failed',
                            result.messageId || null,
                        ]
                    );

                    if (success) sentCount++;
                    else failedCount++;
                }
            } catch (batchErr) {
                console.error(`Batch ${i} failed:`, batchErr.message);
                for (const contact of batch) {
                    await db.query(
                        `INSERT INTO sms_logs (campaign_id, contact_id, phone_number, status, sent_at)
             VALUES (?, ?, ?, 'failed', NOW())`,
                        [campaignId, contact.id, contact.phone_number]
                    );
                    failedCount++;
                }
            }

            // Update counts after each batch
            await db.query(
                `UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?`,
                [sentCount, failedCount, campaignId]
            );

            // Small delay between batches to respect rate limits
            await new Promise((r) => setTimeout(r, 500));
        }

        // Mark campaign as fully sent
        await db.query(`UPDATE campaigns SET status = 'sent' WHERE id = ?`, [campaignId]);

        // Deduct credits from user (deduct actual sent count)
        await db.query(`UPDATE users SET sms_credits = sms_credits - ? WHERE id = ?`, [
            sentCount,
            campaign.user_id,
        ]);

        // Log credit transaction
        await db.query(
            `INSERT INTO credit_transactions (user_id, credits_change, type, reference, description)
       VALUES (?, ?, 'spend', ?, ?)`,
            [campaign.user_id, -sentCount, `campaign_${campaignId}`, `Campaign: ${campaign.name}`]
        );

        console.log(`Campaign ${campaignId} done. Sent: ${sentCount}, Failed: ${failedCount}`);
    },
    { connection: redis, concurrency: 2 }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message));

console.log('SMS Worker running...');