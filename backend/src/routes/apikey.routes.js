const router = require('express').Router();
const auth = require('../middleware/auth');
const { getApiKeys, createApiKey, revokeApiKey, deleteApiKey } = require('../controllers/apikey.controller');

router.use(auth);
router.get('/', getApiKeys);
router.post('/', createApiKey);
router.patch('/:id/revoke', revokeApiKey);
router.delete('/:id', deleteApiKey);

module.exports = router;