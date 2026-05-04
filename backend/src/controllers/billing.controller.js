const db = require('../config/db');
const snippe = require('../config/snippe');
const { generateIdempotencyKey } = require('@snippe/sdk');

const CREDIT_PACKS = {
    pack_1000: { credits: 1000, amount: 5000, label: '1,000 SMS Credits' },
    pack_5000: { credits: 5000, amount: 20000, label: '5,000 SMS Credits' },
    pack_10000: { credits: 10000, amount: 35000, label: '10,000 SMS Credits' },
};

exports.getBalance = async (req, res) => {
    try {
        const [[user]] = await db.query(
            'SELECT sms_credits, plan FROM users WHERE id = ?',
            [req.user.id]
        );
        const [transactions] = await db.query(
            `SELECT * FROM credit_transactions
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
            [req.user.id]
        );
        res.json({ credits: user.sms_credits, plan: user.plan, transactions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCreditPacks = async (req, res) => {
    res.json({ packs: CREDIT_PACKS });
};

exports.buyCredits = async (req, res) => {
    try {
        const { pack } = req.body;
        const selected = CREDIT_PACKS[pack];
        if (!selected) {
            return res.status(400).json({ message: 'Invalid credit pack selected' });
        }

        const session = await snippe.sessions.create(
            {
                amount: selected.amount,
                currency: 'TZS',
                allowed_methods: ['mobile_money', 'qr', 'card'],
                customer: {
                    name: req.user.name,
                    email: req.user.email,
                },
                description: selected.label,
                redirect_url: `${process.env.FRONTEND_URL}/billing/verify`,
                webhook_url: `${process.env.BACKEND_URL}/api/webhooks/snippe`,
                metadata: {
                    user_id: String(req.user.id),
                    credits: String(selected.credits),
                    pack,
                },
                expires_in: 3600,
                display: {
                    show_description: true,
                    button_text: 'Pay Now',
                    success_message: 'Payment successful! Your credits are being added.',
                },
            },
            { idempotencyKey: generateIdempotencyKey() }
        );

        await db.query(
            `INSERT INTO credit_transactions
        (user_id, credits_change, type, reference, description)
       VALUES (?, ?, 'pending', ?, ?)`,
            [req.user.id, selected.credits, session.reference, `Pending top-up: ${selected.label}`]
        );

        res.json({ url: session.checkout_url, reference: session.reference });
    } catch (err) {
        console.error('buyCredits error:', err);
        res.status(500).json({ message: 'Failed to initiate payment' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { session_reference } = req.body;
        if (!session_reference) {
            return res.status(400).json({ message: 'Missing session_reference' });
        }

        const [existing] = await db.query(
            `SELECT id, type FROM credit_transactions WHERE reference = ?`,
            [session_reference]
        );
        if (existing.length && existing[0].type === 'topup') {
            return res.json({ message: 'Payment already processed', alreadyCredited: true });
        }

        const session = await snippe.sessions.retrieve(session_reference);

        if (session.status !== 'completed') {
            return res.status(400).json({
                message: `Payment not completed. Status: ${session.status}`,
            });
        }

        const credits = parseInt(session.metadata?.credits || '0');
        const userId = parseInt(session.metadata?.user_id || '0');

        if (!credits || !userId) {
            return res.status(400).json({ message: 'Invalid session metadata' });
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query(
                'UPDATE users SET sms_credits = sms_credits + ? WHERE id = ?',
                [credits, userId]
            );
            await conn.query(
                `UPDATE credit_transactions SET type = 'topup', description = ?
         WHERE reference = ?`,
                [`Credit top-up: ${credits} SMS`, session_reference]
            );
            await conn.commit();
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }

        res.json({ message: `${credits} SMS credits added to your account`, credits });
    } catch (err) {
        console.error('verifyPayment error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};