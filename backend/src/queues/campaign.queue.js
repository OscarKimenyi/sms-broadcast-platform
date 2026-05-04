const { Queue } = require('bullmq');
const redis = require('../config/redis');

const campaignQueue = new Queue('campaign', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
    },
});

module.exports = campaignQueue;