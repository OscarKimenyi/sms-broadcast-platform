const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

exports.getApiKeys = async (req, res) => {
    const [rows] = await db.query(
        'SELECT id, name, key_prefix, is_active, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json({ api_keys: rows });
};

exports.createApiKey = async (req, res) => {
    try {
        const { name } = req.body;
        const rawKey = `spk_${nanoid(32)}`;
        const prefix = rawKey.substring(0, 10);
        const hash = await bcrypt.hash(rawKey, 10);

        await db.query(
            'INSERT INTO api_keys (user_id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?)',
            [req.user.id, name, hash, prefix]
        );

        // Return the raw key ONCE — we never store it in plain text
        res.status(201).json({
            message: 'API key created. Save it now — it will not be shown again.',
            key: rawKey,
            prefix,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.revokeApiKey = async (req, res) => {
    try {
        await db.query(
            'UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'API key revoked' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteApiKey = async (req, res) => {
    try {
        await db.query('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'API key deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};