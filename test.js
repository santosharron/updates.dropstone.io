#!/usr/bin/env node

/**
 * Test script for Dropstone Update Server
 * This script tests all the main API endpoints
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_FILE_PATH = path.join(__dirname, 'test-file.tar.gz');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

// HTTP request helper
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(options.url);
        const requestOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(requestOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonBody = JSON.parse(body);
                    resolve({ status: res.statusCode, headers: res.headers, body: jsonBody });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: body });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(data);
        }
        req.end();
    });
}

// Create test file
function createTestFile() {
    logInfo('Creating test file...');

    const testDir = path.join(__dirname, 'temp-test');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    const testContent = `This is a test PearAI server file
Version: 1.0.0-test
Platform: server-linux-x64
Quality: stable
Timestamp: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(testDir, 'README.txt'), testContent);
    fs.writeFileSync(path.join(testDir, 'server.js'), 'console.log("Test server");');

    // Create tar.gz file
    const tar = require('tar');
    const gzip = require('zlib').createGzip();
    const output = fs.createWriteStream(TEST_FILE_PATH);

    return new Promise((resolve, reject) => {
        tar.c({
            gzip: true,
            file: TEST_FILE_PATH,
            cwd: testDir
        }, ['README.txt', 'server.js'])
        .then(() => {
            logSuccess('Test file created');
            resolve();
        })
        .catch(reject);
    });
}

// Test functions
async function testHealth() {
    logInfo('Testing health endpoint...');
    try {
        const response = await makeRequest({ url: `${BASE_URL}/health` });
        if (response.status === 200) {
            logSuccess(`Health check passed: ${response.body.status}`);
            return true;
        } else {
            logError(`Health check failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Health check error: ${error.message}`);
        return false;
    }
}

async function testAPI() {
    logInfo('Testing API documentation endpoint...');
    try {
        const response = await makeRequest({ url: BASE_URL });
        if (response.status === 200) {
            logSuccess(`API documentation loaded: ${response.body.name} v${response.body.version}`);
            return true;
        } else {
            logError(`API documentation failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`API documentation error: ${error.message}`);
        return false;
    }
}

async function testUpload() {
    logInfo('Testing file upload...');
    try {
        const FormData = require('form-data');
        const form = new FormData();

        form.append('file', fs.createReadStream(TEST_FILE_PATH));
        form.append('platform', 'server-linux-x64');
        form.append('quality', 'stable');
        form.append('version', '1.0.0-test');
        form.append('name', 'PearAI 1.0.0 Test');

        const response = await makeRequest({
            url: `${BASE_URL}/admin/upload`,
            method: 'POST',
            headers: form.getHeaders()
        }, form);

        if (response.status === 200) {
            logSuccess('File upload successful');
            return true;
        } else {
            logError(`File upload failed: ${response.status} - ${JSON.stringify(response.body)}`);
            return false;
        }
    } catch (error) {
        logError(`File upload error: ${error.message}`);
        return false;
    }
}

async function testLatestVersion() {
    logInfo('Testing latest version endpoint...');
    try {
        const response = await makeRequest({
            url: `${BASE_URL}/api/latest/server-linux-x64/stable`
        });

        if (response.status === 200) {
            logSuccess(`Latest version: ${response.body.version} - ${response.body.name}`);
            return true;
        } else {
            logWarning(`Latest version not found: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Latest version error: ${error.message}`);
        return false;
    }
}

async function testSpecificVersion() {
    logInfo('Testing specific version endpoint...');
    try {
        const response = await makeRequest({
            url: `${BASE_URL}/api/versions/1.0.0-test/server-linux-x64/stable`
        });

        if (response.status === 200) {
            logSuccess(`Specific version found: ${response.body.version}`);
            return true;
        } else {
            logWarning(`Specific version not found: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Specific version error: ${error.message}`);
        return false;
    }
}

async function testDownload() {
    logInfo('Testing download endpoint...');
    try {
        const response = await makeRequest({
            url: `${BASE_URL}/commit:1.0.0-test/server-linux-x64/stable`
        });

        if (response.status === 200) {
            logSuccess('Download endpoint working');
            return true;
        } else {
            logWarning(`Download not found: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError(`Download error: ${error.message}`);
        return false;
    }
}

async function testAdminEndpoints() {
    logInfo('Testing admin endpoints...');

    try {
        // Test versions list
        const versionsResponse = await makeRequest({
            url: `${BASE_URL}/admin/versions`
        });

        if (versionsResponse.status === 200) {
            logSuccess(`Admin versions endpoint working (${versionsResponse.body.length} versions)`);
        } else {
            logError(`Admin versions failed: ${versionsResponse.status}`);
        }

        // Test latest list
        const latestResponse = await makeRequest({
            url: `${BASE_URL}/admin/latest`
        });

        if (latestResponse.status === 200) {
            logSuccess(`Admin latest endpoint working (${latestResponse.body.length} latest)`);
        } else {
            logError(`Admin latest failed: ${latestResponse.status}`);
        }

        return true;
    } catch (error) {
        logError(`Admin endpoints error: ${error.message}`);
        return false;
    }
}

// Cleanup function
function cleanup() {
    logInfo('Cleaning up test files...');

    if (fs.existsSync(TEST_FILE_PATH)) {
        fs.unlinkSync(TEST_FILE_PATH);
    }

    const testDir = path.join(__dirname, 'temp-test');
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }

    logSuccess('Cleanup completed');
}

// Main test function
async function runTests() {
    log('Starting Dropstone Update Server Tests', 'bright');
    log('=====================================', 'bright');

    const results = [];

    try {
        // Create test file
        await createTestFile();

        // Run tests
        results.push(await testHealth());
        results.push(await testAPI());
        results.push(await testUpload());
        results.push(await testLatestVersion());
        results.push(await testSpecificVersion());
        results.push(await testDownload());
        results.push(await testAdminEndpoints());

        // Summary
        const passed = results.filter(r => r).length;
        const total = results.length;

        log('\nTest Summary:', 'bright');
        log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');

        if (passed === total) {
            logSuccess('All tests passed! 🎉');
        } else {
            logWarning('Some tests failed. Check the output above.');
        }

    } catch (error) {
        logError(`Test execution error: ${error.message}`);
    } finally {
        cleanup();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testHealth,
    testAPI,
    testUpload,
    testLatestVersion,
    testSpecificVersion,
    testDownload,
    testAdminEndpoints
};
