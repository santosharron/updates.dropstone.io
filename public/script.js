// Global variables
let versions = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadVersions();
});

// Quick add function
async function quickAdd() {
    console.log('Quick add function called');

    const url = document.getElementById('quickUrl').value;
    const platform = document.getElementById('quickPlatform').value;

    console.log('URL:', url);
    console.log('Platform:', platform);

    if (!url || !platform) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Extract version from URL or use current date
    const version = extractVersionFromUrl(url) || new Date().toISOString().slice(0, 10);
    const name = `Dropstone ${version}`;

    console.log('Version:', version);
    console.log('Name:', name);

    await addExternalUrl(url, platform, 'stable', version, name);
}

// Extract version from URL
function extractVersionFromUrl(url) {
    const match = url.match(/v?(\d+\.\d+\.\d+)/i);
    return match ? match[1] : null;
}

// Add external URL
async function addExternalUrl(externalUrl, platform, quality, version, name) {
    console.log('Adding external URL:', { externalUrl, platform, quality, version, name });
    showLoading(true);

    try {
        const requestBody = {
            externalUrl,
            platform,
            quality,
            version,
            name
        };

        console.log('Request body:', requestBody);

        const response = await fetch('/admin/add-external', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response result:', result);

        if (response.ok) {
            showAlert('External URL added successfully!', 'success');
            document.getElementById('addForm').reset();
            loadVersions();
        } else {
            showAlert(result.error || 'Failed to add external URL', 'error');
        }
    } catch (error) {
        console.error('Error in addExternalUrl:', error);
        showAlert('Network error: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const externalUrl = document.getElementById('externalUrl').value;
        const platform = document.getElementById('platform').value;
        const quality = document.getElementById('quality').value;
        const version = document.getElementById('version').value;
        const name = document.getElementById('name').value;

        await addExternalUrl(externalUrl, platform, quality, version, name);
    });
});

// Load versions
async function loadVersions() {
    try {
        const response = await fetch('/admin/versions');
        versions = await response.json();
        displayVersions();
    } catch (error) {
        console.error('Error loading versions:', error);
        document.getElementById('versionsContainer').innerHTML = '<p>Error loading versions</p>';
    }
}

// Display versions
function displayVersions() {
    const container = document.getElementById('versionsContainer');

    if (versions.length === 0) {
        container.innerHTML = '<p>No versions found</p>';
        return;
    }

    const versionsHtml = versions.map(version => `
        <div class="version-card">
            <h3>${version.name} ${version.externalUrl ? '<span class="external-url-indicator">External URL</span>' : ''}</h3>
            <div class="version-info">
                <strong>Platform:</strong> ${version.key.split('-')[0]}-${version.key.split('-')[1]}
            </div>
            <div class="version-info">
                <strong>Quality:</strong> ${version.key.split('-')[2]}
            </div>
            <div class="version-info">
                <strong>Version:</strong> ${version.version}
            </div>
            <div class="version-info">
                <strong>Added:</strong> ${new Date(version.timestamp).toLocaleString()}
            </div>
            ${version.url && version.url.startsWith('http') ? `
                <div class="version-info">
                    <strong>URL:</strong> <a href="${version.url}" target="_blank">${version.url}</a>
                </div>
            ` : ''}
            <button class="delete-btn" onclick="deleteVersion('${version.key}')">Delete</button>
        </div>
    `).join('');

    container.innerHTML = `<div class="versions-grid">${versionsHtml}</div>`;
}

// Delete version
async function deleteVersion(key) {
    if (!confirm('Are you sure you want to delete this version?')) {
        return;
    }

    try {
        const [platform, quality, version] = key.split('-');
        const response = await fetch(`/admin/versions/${platform}-${quality}/${quality}/${version}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('Version deleted successfully!', 'success');
            loadVersions();
        } else {
            const result = await response.json();
            showAlert(result.error || 'Failed to delete version', 'error');
        }
    } catch (error) {
        showAlert('Network error: ' + error.message, 'error');
    }
}

// Show alert
function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Show/hide loading
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}
