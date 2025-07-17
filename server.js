const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const multer = require('multer');
const archiver = require('archiver');
const unzipper = require('unzipper');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Update data structure
const updates = {
  versions: new Map(),
  latest: new Map(),
  downloads: new Map()
};

// Initialize update data
function initializeUpdateData() {
  const dataDir = path.join(__dirname, 'data');
  fs.ensureDirSync(dataDir);

  // Load existing data
  const versionsFile = path.join(dataDir, 'versions.json');
  const latestFile = path.join(dataDir, 'latest.json');
  const downloadsFile = path.join(dataDir, 'downloads.json');

  if (fs.existsSync(versionsFile)) {
    const versionsData = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
    updates.versions = new Map(Object.entries(versionsData));
  }

  if (fs.existsSync(latestFile)) {
    const latestData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    updates.latest = new Map(Object.entries(latestData));
  }

  if (fs.existsSync(downloadsFile)) {
    const downloadsData = JSON.parse(fs.readFileSync(downloadsFile, 'utf8'));
    updates.downloads = new Map(Object.entries(downloadsData));
  }
}

// Save update data
function saveUpdateData() {
  const dataDir = path.join(__dirname, 'data');
  fs.ensureDirSync(dataDir);

  const versionsData = Object.fromEntries(updates.versions);
  const latestData = Object.fromEntries(updates.latest);
  const downloadsData = Object.fromEntries(updates.downloads);

  fs.writeFileSync(path.join(dataDir, 'versions.json'), JSON.stringify(versionsData, null, 2));
  fs.writeFileSync(path.join(dataDir, 'latest.json'), JSON.stringify(latestData, null, 2));
  fs.writeFileSync(path.join(dataDir, 'downloads.json'), JSON.stringify(downloadsData, null, 2));
}

// Generate download key
function generateDownloadKey(platform, quality, version) {
  return `${platform}-${quality}-${version}`;
}

// API Routes

// Get latest version for a platform and quality
app.get('/api/latest/:platform/:quality', (req, res) => {
  const { platform, quality } = req.params;
  const key = `${platform}-${quality}`;

  const latest = updates.latest.get(key);
  if (!latest) {
    return res.status(404).json({ error: 'No latest version found' });
  }

  res.json({
    version: latest.version,
    name: latest.name,
    timestamp: latest.timestamp,
    url: latest.url,
    sha256hash: latest.sha256hash
  });
});

// Get specific version for a platform and quality
app.get('/api/versions/:version/:platform/:quality', (req, res) => {
  const { version, platform, quality } = req.params;
  const key = `${platform}-${quality}-${version}`;

  const versionData = updates.versions.get(key);
  if (!versionData) {
    return res.status(404).json({ error: 'Version not found' });
  }

  res.json({
    version: versionData.version,
    name: versionData.name,
    timestamp: versionData.timestamp,
    url: versionData.url,
    sha256hash: versionData.sha256hash
  });
});

// Download endpoint for specific commit
app.get('/commit::commit/:platform/:quality', (req, res) => {
  const { commit, platform, quality } = req.params;
  const downloadKey = generateDownloadKey(platform, quality, commit);

  const downloadInfo = updates.downloads.get(downloadKey);
  if (!downloadInfo) {
    return res.status(404).json({ error: 'Download not found' });
  }

  // Handle external URLs
  if (downloadInfo.externalUrl) {
    return res.redirect(downloadInfo.externalUrl);
  }

  // Handle local files
  const filePath = path.join(__dirname, 'downloads', downloadInfo.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Download file not found' });
  }

  res.download(filePath, downloadInfo.originalName);
});

// Admin routes for managing updates

// Upload new version (supports both file upload and external URL)
app.post('/admin/upload', upload.single('file'), async (req, res) => {
  try {
    const { platform, quality, version, name, externalUrl } = req.body;

    if (!req.file && !externalUrl) {
      return res.status(400).json({ error: 'Either file upload or external URL is required' });
    }

    if (!platform || !quality || !version || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const downloadKey = generateDownloadKey(platform, quality, version);
    const timestamp = Date.now();

    let sha256hash, fileSize, originalName, finalPath;

    if (externalUrl) {
      // Handle external URL
      try {
        // Validate URL
        const url = new URL(externalUrl);

        // For external URLs, we'll store the URL and calculate hash later if needed
        sha256hash = 'external-url'; // Placeholder, can be calculated later
        fileSize = 0; // Unknown size for external URLs
        originalName = path.basename(url.pathname) || 'external-file';
        finalPath = externalUrl; // Store the external URL

        console.log(`Adding external URL: ${externalUrl} for platform: ${platform}, quality: ${quality}, version: ${version}`);
      } catch (urlError) {
        return res.status(400).json({ error: 'Invalid external URL format' });
      }
    } else {
      // Handle file upload
      const file = req.file;

      // Calculate SHA256 hash
      const fileBuffer = fs.readFileSync(file.path);
      sha256hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Move file to downloads directory
      const downloadsDir = path.join(__dirname, 'downloads');
      fs.ensureDirSync(downloadsDir);
      finalPath = path.join(downloadsDir, `${downloadKey}-${timestamp}${path.extname(file.originalname)}`);
      fs.moveSync(file.path, finalPath);

      fileSize = file.size;
      originalName = file.originalname;
    }

    // Create version data
    const versionData = {
      version,
      name,
      timestamp,
      url: externalUrl ? externalUrl : `/commit:${version}/${platform}/${quality}`,
      sha256hash
    };

    const versionKey = `${platform}-${quality}-${version}`;
    updates.versions.set(versionKey, versionData);

    // Create download data
    const downloadData = {
      filename: externalUrl ? 'external-url' : path.basename(finalPath),
      originalName,
      size: fileSize,
      sha256hash,
      externalUrl: externalUrl || null
    };
    updates.downloads.set(downloadKey, downloadData);

    // Update latest if this is newer
    const latestKey = `${platform}-${quality}`;
    const currentLatest = updates.latest.get(latestKey);

    if (!currentLatest || version > currentLatest.version) {
      updates.latest.set(latestKey, versionData);
    }

    saveUpdateData();

    res.json({
      success: true,
      message: externalUrl ? 'External URL added successfully' : 'Version uploaded successfully',
      version: versionData
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// New endpoint for adding external download URLs
app.post('/admin/add-external', async (req, res) => {
  console.log('Received add-external request:', req.body);

  try {
    const { platform, quality, version, name, externalUrl } = req.body;

    console.log('Parsed fields:', { platform, quality, version, name, externalUrl });

    if (!platform || !quality || !version || !name || !externalUrl) {
      console.log('Missing fields detected');
      return res.status(400).json({ error: 'Missing required fields: platform, quality, version, name, externalUrl' });
    }

    // Validate URL
    try {
      new URL(externalUrl);
      console.log('URL validation passed');
    } catch (urlError) {
      console.log('URL validation failed:', urlError);
      return res.status(400).json({ error: 'Invalid external URL format' });
    }

    const downloadKey = generateDownloadKey(platform, quality, version);
    const timestamp = Date.now();

    // Create version data
    const versionData = {
      version,
      name,
      timestamp,
      url: externalUrl,
      sha256hash: 'external-url'
    };

    const versionKey = `${platform}-${quality}-${version}`;
    updates.versions.set(versionKey, versionData);

    // Create download data
    const downloadData = {
      filename: 'external-url',
      originalName: path.basename(new URL(externalUrl).pathname) || 'external-file',
      size: 0,
      sha256hash: 'external-url',
      externalUrl: externalUrl
    };
    updates.downloads.set(downloadKey, downloadData);

    // Update latest if this is newer
    const latestKey = `${platform}-${quality}`;
    const currentLatest = updates.latest.get(latestKey);

    if (!currentLatest || version > currentLatest.version) {
      updates.latest.set(latestKey, versionData);
    }

    saveUpdateData();

    console.log('External URL added successfully:', versionData);

    res.json({
      success: true,
      message: 'External URL added successfully',
      version: versionData
    });

  } catch (error) {
    console.error('Add external URL error:', error);
    res.status(500).json({ error: 'Failed to add external URL' });
  }
});

// List all versions
app.get('/admin/versions', (req, res) => {
  const versions = Array.from(updates.versions.entries()).map(([key, data]) => ({
    key,
    ...data
  }));

  res.json(versions);
});

// List latest versions
app.get('/admin/latest', (req, res) => {
  const latest = Array.from(updates.latest.entries()).map(([key, data]) => ({
    key,
    ...data
  }));

  res.json(latest);
});

// Delete version
app.delete('/admin/versions/:platform/:quality/:version', (req, res) => {
  const { platform, quality, version } = req.params;
  const versionKey = `${platform}-${quality}-${version}`;
  const downloadKey = generateDownloadKey(platform, quality, version);

  // Remove from versions
  updates.versions.delete(versionKey);

  // Remove download file
  const downloadInfo = updates.downloads.get(downloadKey);
  if (downloadInfo) {
    const filePath = path.join(__dirname, 'downloads', downloadInfo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    updates.downloads.delete(downloadKey);
  }

  // Update latest if this was the latest version
  const latestKey = `${platform}-${quality}`;
  const currentLatest = updates.latest.get(latestKey);
  if (currentLatest && currentLatest.version === version) {
    // Find the next latest version
    const platformVersions = Array.from(updates.versions.entries())
      .filter(([key]) => key.startsWith(`${platform}-${quality}-`))
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.version.localeCompare(a.version));

    if (platformVersions.length > 0) {
      updates.latest.set(latestKey, platformVersions[0]);
    } else {
      updates.latest.delete(latestKey);
    }
  }

  saveUpdateData();

  res.json({ success: true, message: 'Version deleted successfully' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    versions: updates.versions.size,
    latest: updates.latest.size,
    downloads: updates.downloads.size
  });
});

// Dropstone backup server API endpoint (matches product.json)
app.get('/dropstone-backup-server-api', (req, res) => {
  res.json({
    name: 'Dropstone Backup Server API',
    version: '1.0.0',
    endpoints: {
      latest: '/api/latest/:platform/:quality',
      version: '/api/versions/:version/:platform/:quality',
      download: '/commit::commit/:platform/:quality',
      health: '/health'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Dropstone Update Server',
    version: '1.0.0',
    endpoints: {
      latest: '/api/latest/:platform/:quality',
      version: '/api/versions/:version/:platform/:quality',
      download: '/commit::commit/:platform/:quality',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize and start server
initializeUpdateData();

app.listen(PORT, () => {
  console.log(`Dropstone Update Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API documentation: http://localhost:${PORT}/`);
});

module.exports = app;
