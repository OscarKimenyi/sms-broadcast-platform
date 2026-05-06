const router = require('express').Router();
const auth = require('../middleware/auth');
const { exportCampaignLogs, exportContacts } = require('../controllers/export.controller');

router.use(auth);
router.get('/campaigns/:id', exportCampaignLogs);
router.get('/contacts/:listId', exportContacts);

module.exports = router;