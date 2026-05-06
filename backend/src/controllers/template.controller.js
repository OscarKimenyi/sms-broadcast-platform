const db = require('../config/db');

exports.getTemplates = async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json({ templates: rows });
};

exports.createTemplate = async (req, res) => {
    try {
        const { name, body } = req.body;
        const [result] = await db.query(
            'INSERT INTO templates (user_id, name, body) VALUES (?, ?, ?)',
            [req.user.id, name, body]
        );
        res.status(201).json({ message: 'Template created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { name, body } = req.body;
        await db.query(
            'UPDATE templates SET name = ?, body = ? WHERE id = ? AND user_id = ?',
            [name, body, req.params.id, req.user.id]
        );
        res.json({ message: 'Template updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        await db.query('DELETE FROM templates WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};