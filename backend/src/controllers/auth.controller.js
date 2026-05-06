const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const emailService = require('../services/email.service');
const { nanoid } = require('nanoid');

exports.register = async (req, res) => {
    try {
        const { name, email, password, referral_code } = req.body;

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length) return res.status(400).json({ message: 'Email already in use' });

        const hash = await bcrypt.hash(password, 12);
        const myReferralCode = nanoid(8).toUpperCase();

        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, referral_code) VALUES (?, ?, ?, ?)',
            [name, email, hash, myReferralCode]
        );
        const userId = result.insertId;

        // Handle referral
        if (referral_code) {
            const [referrer] = await db.query(
                'SELECT id FROM users WHERE referral_code = ?',
                [referral_code]
            );
            if (referrer.length) {
                await db.query(
                    'INSERT INTO referrals (referrer_id, referred_id, referral_code) VALUES (?, ?, ?)',
                    [referrer[0].id, userId, referral_code]
                );
                await db.query('UPDATE users SET referred_by = ? WHERE id = ?', [referrer[0].id, userId]);
            }
        }

        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        const newUser = { id: userId, name, email, plan: 'free', sms_credits: 50 };
        emailService.sendWelcome(newUser);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { ...newUser, referral_code: myReferralCode },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!rows.length) return res.status(400).json({ message: 'Invalid email or password' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        res.json({
            token,
            user: {
                id: user.id, name: user.name, email: user.email,
                plan: user.plan, sms_credits: user.sms_credits,
                referral_code: user.referral_code,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    const [rows] = await db.query(
        'SELECT id, name, email, plan, sms_credits, referral_code, email_notifications, low_credit_threshold FROM users WHERE id = ?',
        [req.user.id]
    );
    res.json({ user: rows[0] });
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, email_notifications, low_credit_threshold } = req.body;
        await db.query(
            'UPDATE users SET name = ?, email = ?, email_notifications = ?, low_credit_threshold = ? WHERE id = ?',
            [name, email, email_notifications ? 1 : 0, low_credit_threshold || 100, req.user.id]
        );
        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const match = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

        const hash = await bcrypt.hash(new_password, 12);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};