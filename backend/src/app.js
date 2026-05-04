const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { limiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth.routes');
const contactRoutes = require('./routes/contact.routes');
const campaignRoutes = require('./routes/campaign.routes');
const billingRoutes = require('./routes/billing.routes');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();

// ⚠️  Webhooks FIRST — before express.json() so Snippe raw body is preserved
app.use('/api/webhooks', webhookRoutes);

// All other routes use standard JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/billing', billingRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;