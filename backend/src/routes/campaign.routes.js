const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    getCampaigns, getCampaign, createCampaign,
    sendCampaign, getCampaignLogs, deleteCampaign,
    duplicateCampaign,
} = require('../controllers/campaign.controller');

router.use(auth);
router.get('/', getCampaigns);
router.get('/:id', getCampaign);
router.post('/', createCampaign);
router.post('/:id/send', sendCampaign);
router.post('/:id/duplicate', duplicateCampaign);
router.get('/:id/logs', getCampaignLogs);
router.delete('/:id', deleteCampaign);

module.exports = router;