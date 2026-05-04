const router = require('express').Router();
const {
    snippeWebhook,
    deliveryReport,
    inboundSMS,
} = require('../controllers/webhook.controller');

// Capture raw body for Snippe signature verification
// Must come BEFORE express.json() parses the body
const captureRawBody = (req, res, next) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
        req.rawBody = data;
        req.body = JSON.parse(data || '{}');
        next();
    });
};

// Snippe payment webhook — needs raw body
router.post('/snippe', captureRawBody, snippeWebhook);

// Africa's Talking callbacks — standard JSON body is fine
router.post('/dlr', deliveryReport);
router.post('/inbound', inboundSMS);

module.exports = router;