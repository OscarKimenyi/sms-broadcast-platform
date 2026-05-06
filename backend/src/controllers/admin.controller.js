const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        const [[users]] = await db.query('SELECT COUNT(*) as total FROM users');
        const [[campaigns]] = await db.query('SELECT COUNT(*) as total FROM campaigns');
        const [[smsTotal]] = await db.query('SELECT COALESCE(SUM(sent_count),0) as total FROM campaigns');
        const [[revenue]] = await db.query(
            `SELECT COALESCE(SUM(credits_change),0) as total FROM credit_transactions WHERE type='topup'`
        );
        res.json({
            total_users: users.total,
            total_campaigns: campaigns.total,
            total_sms_sent: smsTotal.total,
            total_credits_sold: revenue.total,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const [rows] = await db.query(
            `SELECT id, name, email, plan, sms_credits, created_at
       FROM users WHERE name LIKE ? OR email LIKE ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [`%${search}%`, `%${search}%`, limit, offset]
        );
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM users WHERE name LIKE ? OR email LIKE ?',
            [`%${search}%`, `%${search}%`]
        );
        res.json({ users: rows, total, page });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.adjustCredits = async (req, res) => {
    try {
        const { user_id, amount, reason } = req.body;
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query('UPDATE users SET sms_credits = sms_credits + ? WHERE id = ?', [amount, user_id]);
            await conn.query(
                `INSERT INTO credit_transactions (user_id, credits_change, type, description)
         VALUES (?, ?, 'topup', ?)`,
                [user_id, amount, `Admin adjustment: ${reason || 'manual'}`]
            );
            await conn.commit();
        } catch (e) { await conn.rollback(); throw e; }
        finally { conn.release(); }
        res.json({ message: 'Credits adjusted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPendingSenderIds = async (req, res) => {
    const [rows] = await db.query(
        `SELECT s.*, u.name as user_name, u.email as user_email
     FROM sender_ids s JOIN users u ON s.user_id = u.id
     WHERE s.status = 'pending' ORDER BY s.created_at ASC`
    );
    res.json({ sender_ids: rows });
};

exports.approveSenderId = async (req, res) => {
    await db.query("UPDATE sender_ids SET status = 'approved' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Sender ID approved' });
};

exports.rejectSenderId = async (req, res) => {
    await db.query("UPDATE sender_ids SET status = 'rejected' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Sender ID rejected' });
};