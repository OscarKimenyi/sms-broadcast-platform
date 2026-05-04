const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await db.query('SELECT id, name, email, plan, sms_credits FROM users WHERE id = ?', [decoded.id]);
        if (!rows.length) return res.status(401).json({ message: 'User not found' });

        req.user = rows[0];
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = auth;