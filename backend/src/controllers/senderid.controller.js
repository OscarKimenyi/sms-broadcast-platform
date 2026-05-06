const db = require('../config/db');

exports.getSenderIds = async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM sender_ids WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json({ sender_ids: rows });
};

exports.createSenderId = async (req, res) => {
    try {
        const { sender_name, description } = req.body;
        if (!sender_name || sender_name.length > 11) {
            return res.status(400).json({ message: 'Sender name must be 1–11 characters' });
        }
        const [existing] = await db.query(
            'SELECT id FROM sender_ids WHERE user_id = ? AND sender_name = ?',
            [req.user.id, sender_name]
        );
        if (existing.length) return res.status(400).json({ message: 'Sender ID already exists' });

        const [result] = await db.query(
            'INSERT INTO sender_ids (user_id, sender_name, description, status) VALUES (?, ?, ?, ?)',
            [req.user.id, sender_name.toUpperCase(), description || null, 'pending']
        );
        res.status(201).json({ message: 'Sender ID submitted for approval', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteSenderId = async (req, res) => {
    try {
        await db.query('DELETE FROM sender_ids WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Sender ID deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};