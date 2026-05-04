const { verifyWebhook } = require('@snippe/sdk');
const db = require('../config/db');

// ─── Credit user helper ───────────────────────────────────────────────────────
async function creditUser(sessionReference, credits, userId) {
    const [existing] = await db.query(
        `SELECT id, type FROM credit_transactions WHERE reference = ?`,
        [sessionReference]
    );

    if (existing.length && existing[0].type === 'topup') {
        console.log(`Webhook: ${sessionReference} already credited, skipping`);
        return false;
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            'UPDATE users SET sms_credits = sms_credits + ? WHERE id = ?',
            [credits, userId]
        );

        if (existing.length) {
            await conn.query(
                `UPDATE credit_transactions SET type = 'topup', description = ?
         WHERE reference = ?`,
                [`Credit top-up: ${credits} SMS (webhook)`, sessionReference]
            );
        } else {
            await conn.query(
                `INSERT INTO credit_transactions
          (user_id, credits_change, type, reference, description)
         VALUES (?, ?, 'topup', ?, ?)`,
                [userId, credits, sessionReference, `Credit top-up: ${credits} SMS (webhook)`]
            );
        }

        await conn.commit();
        console.log(`Webhook: credited ${credits} SMS to user ${userId}`);
        return true;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ─── POST /api/webhooks/snippe ────────────────────────────────────────────────
exports.snippeWebhook = async (req, res) => {
    // Respond immediately — Snippe expects a fast 200
    res.status(200).send('OK');

    try {
        // Use the SDK's verifyWebhook — handles HMAC, timing attack prevention,
        // replay attack detection, and JSON parsing in one call
        const event = verifyWebhook({
            rawBody: req.rawBody,
            signature: req.headers['x-webhook-signature'],
            timestamp: req.headers['x-webhook-timestamp'],
            signingKey: process.env.SNIPPE_WEBHOOK_SECRET,
        });

        const { type, data } = event;
        console.log(`Snippe webhook: ${type}`, { eventId: event.id, ref: data?.reference });

        if (type === 'payment.completed') {
            const sessionReference = data.session_reference || data.reference;
            const metadata = data.metadata || {};
            const credits = parseInt(metadata.credits || '0');
            const userId = parseInt(metadata.user_id || '0');

            if (!credits || !userId || !sessionReference) {
                console.warn('Snippe webhook: missing metadata fields');
                return;
            }

            await creditUser(sessionReference, credits, userId);
        }

        if (type === 'payment.failed') {
            console.log(`Payment failed: ${data.reference}`, { reason: data.failure_reason });
            await db.query(
                `UPDATE credit_transactions SET type = 'failed', description = ?
         WHERE reference = ? AND type = 'pending'`,
                [`Payment failed: ${data.failure_reason || 'unknown'}`, data.reference]
            );
        }
    } catch (err) {
        console.error('Snippe webhook error:', err.message);
    }
};

// ─── POST /api/webhooks/dlr ───────────────────────────────────────────────────
exports.deliveryReport = async (req, res) => {
    try {
        const { id: messageId, status } = req.body;
        if (!messageId) return res.sendStatus(200);

        const dlrStatus = status === 'Success' ? 'delivered' : 'failed';

        await db.query(
            `UPDATE sms_logs SET status = ?, delivered_at = NOW()
       WHERE gateway_message_id = ?`,
            [dlrStatus, messageId]
        );

        if (dlrStatus === 'delivered') {
            await db.query(
                `UPDATE campaigns c
         INNER JOIN sms_logs l ON l.campaign_id = c.id
         SET c.delivered_count = c.delivered_count + 1
         WHERE l.gateway_message_id = ?`,
                [messageId]
            );
        } else {
            await db.query(
                `UPDATE campaigns c
         INNER JOIN sms_logs l ON l.campaign_id = c.id
         SET c.failed_count = c.failed_count + 1
         WHERE l.gateway_message_id = ?`,
                [messageId]
            );
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('DLR webhook error:', err);
        res.sendStatus(200);
    }
};

// ─── POST /api/webhooks/inbound ───────────────────────────────────────────────
exports.inboundSMS = async (req, res) => {
    try {
        const { from, to, text } = req.body;

        const [senders] = await db.query(
            `SELECT user_id FROM sender_ids
       WHERE sender_name = ? AND status = 'approved'`,
            [to]
        );

        const userId = senders.length ? senders[0].user_id : null;

        await db.query(
            `INSERT INTO inbound_messages (user_id, from_number, to_sender_id, message_body)
       VALUES (?, ?, ?, ?)`,
            [userId, from, to, text]
        );

        res.sendStatus(200);
    } catch (err) {
        console.error('Inbound SMS webhook error:', err);
        res.sendStatus(200);
    }
};