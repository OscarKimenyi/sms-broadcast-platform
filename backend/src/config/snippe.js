const { Snippe } = require('@snippe/sdk');

const snippe = new Snippe({
    apiKey: process.env.SNIPPE_API_KEY,
});

module.exports = snippe;