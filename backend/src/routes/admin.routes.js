const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
    getStats, getUsers, adjustCredits,
    getPendingSenderIds, approveSenderId, rejectSenderId
} = require('../controllers/admin.controller');

router.use(auth, admin);
router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/credits', adjustCredits);
router.get('/sender-ids/pending', getPendingSenderIds);
router.patch('/sender-ids/:id/approve', approveSenderId);
router.patch('/sender-ids/:id/reject', rejectSenderId);

module.exports = router;