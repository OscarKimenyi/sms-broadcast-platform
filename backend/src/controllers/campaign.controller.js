const db = require('../config/db');
const campaignQueue = require('../queues/campaign.queue');

exports.getCampaigns = async (req, res) => {
    try {
        const [campaigns] = await db.query(
            'SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ campaigns });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCampaign = async (req, res) => {
    try {
        const [campaigns] = await db.query(
            'SELECT * FROM campaigns WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (!campaigns.length) return res.status(404).json({ message: 'Campaign not found' });
        res.json({ campaign: campaigns[0] });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createCampaign = async (req, res) => {
    try {
        const { name, list_id, sender_id, message_body, scheduled_at } = req.body;

        // Get contact count for this list
        const [lists] = await db.query(
            'SELECT contact_count FROM contact_lists WHERE id = ? AND user_id = ?',
            [list_id, req.user.id]
        );
        if (!lists.length) return res.status(404).json({ message: 'Contact list not found' });

        const totalRecipients = lists[0].contact_count;

        // Check credits
        if (req.user.sms_credits < totalRecipients) {
            return res.status(400).json({
                message: `Insufficient credits. You need ${totalRecipients} credits but have ${req.user.sms_credits}.`,
            });
        }

        const [result] = await db.query(
            `INSERT INTO campaigns (user_id, sender_id, list_id, name, message_body, status, total_recipients, scheduled_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`,
            [req.user.id, sender_id || null, list_id, name, message_body, totalRecipients, scheduled_at || null]
        );

        res.status(201).json({ message: 'Campaign created', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.sendCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        const [campaigns] = await db.query(
            'SELECT * FROM campaigns WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        if (!campaigns.length) return res.status(404).json({ message: 'Campaign not found' });

        const campaign = campaigns[0];
        if (!['draft', 'failed'].includes(campaign.status)) {
            return res.status(400).json({ message: `Campaign is already ${campaign.status}` });
        }

        // Re-check credits
        const [[user]] = await db.query('SELECT sms_credits FROM users WHERE id = ?', [req.user.id]);
        if (user.sms_credits < campaign.total_recipients) {
            return res.status(400).json({ message: 'Insufficient SMS credits' });
        }

        // Mark as queued
        await db.query(`UPDATE campaigns SET status = 'queued' WHERE id = ?`, [id]);

        // Push to BullMQ
        const delay = campaign.scheduled_at
            ? Math.max(0, new Date(campaign.scheduled_at) - Date.now())
            : 0;

        await campaignQueue.add('send-campaign', { campaignId: parseInt(id) }, { delay });

        res.json({ message: delay > 0 ? 'Campaign scheduled' : 'Campaign queued for sending' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCampaignLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const [logs] = await db.query(
            'SELECT * FROM sms_logs WHERE campaign_id = ? LIMIT ? OFFSET ?',
            [req.params.id, limit, offset]
        );
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM sms_logs WHERE campaign_id = ?',
            [req.params.id]
        );

        res.json({ logs, total });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteCampaign = async (req, res) => {
    try {
        await db.query('DELETE FROM campaigns WHERE id = ? AND user_id = ?', [
            req.params.id,
            req.user.id,
        ]);
        res.json({ message: 'Campaign deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};