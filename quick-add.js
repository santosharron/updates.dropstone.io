#!/usr/bin/env node

const fetch = require('node-fetch');

// Configuration
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'http://localhost:3000';
const DEFAULT_EXTERNAL_URL = 'https://downloads-dropstone.netlify.app/Dropstone%20Setup%20Installer%20(v1.96.4%20Stable).exe';

async function addExternalUrl(externalUrl, platform, quality, version, name) {
    try {
        console.log(`Adding external URL: ${externalUrl}`);
        console.log(`Platform: ${platform}, Quality: ${quality}, Version: ${version}, Name: ${name}`);

        const response = await fetch(`${UPDATE_SERVER_URL}/admin/add-external`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                externalUrl,
                platform,
                quality,
                version,
                name
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ External URL added successfully!');
            console.log('Version data:', result.version);
        } else {
            console.error('❌ Failed to add external URL:', result.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        process.exit(1);
    }
}

// Extract version from URL
function extractVersionFromUrl(url) {
    const match = url.match(/v?(\d+\.\d+\.\d+)/i);
    return match ? match[1] : null;
}

// Main function
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Use default values
        const externalUrl = DEFAULT_EXTERNAL_URL;
        const platform = 'cli-win32-x64';
        const quality = 'stable';
        const version = extractVersionFromUrl(externalUrl) || '1.96.4';
        const name = `Dropstone ${version}`;

        console.log('🚀 Quick Add External URL');
        console.log('Using default values:');
        console.log(`URL: ${externalUrl}`);
        console.log(`Platform: ${platform}`);
        console.log(`Quality: ${quality}`);
        console.log(`Version: ${version}`);
        console.log(`Name: ${name}`);
        console.log('');

        await addExternalUrl(externalUrl, platform, quality, version, name);
    } else if (args.length >= 5) {
        // Use provided arguments: url platform quality version name
        const [externalUrl, platform, quality, version, name] = args;
        await addExternalUrl(externalUrl, platform, quality, version, name);
    } else {
        console.log('Usage:');
        console.log('  node quick-add.js                                    # Use default values');
        console.log('  node quick-add.js <url> <platform> <quality> <version> <name>');
        console.log('');
        console.log('Examples:');
        console.log('  node quick-add.js');
        console.log('  node quick-add.js "https://example.com/file.exe" cli-win32-x64 stable 1.96.4 "Dropstone 1.96.4"');
        console.log('');
        console.log('Platform options:');
        console.log('  cli-win32-x64, cli-win32-arm64, cli-darwin, cli-darwin-arm64, cli-linux-x64, cli-linux-arm64');
        console.log('');
        console.log('Quality options:');
        console.log('  stable, insider, exploration');
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { addExternalUrl, extractVersionFromUrl };
