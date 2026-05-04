const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    getBalance,
    getCreditPacks,
    buyCredits,
    verifyPayment,
} = require('../controllers/billing.controller');

router.use(auth);

router.get('/balance', getBalance);
router.get('/packs', getCreditPacks);
router.post('/buy', buyCredits);
router.post('/verify', verifyPayment);

module.exports = router;