const router = require('express').Router();
const auth = require('../middleware/auth');
const { getSenderIds, createSenderId, deleteSenderId } = require('../controllers/senderid.controller');

router.use(auth);
router.get('/', getSenderIds);
router.post('/', createSenderId);
router.delete('/:id', deleteSenderId);

module.exports = router;