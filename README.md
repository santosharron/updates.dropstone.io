# Dropstone Update Server

A Node.js-based update server for PearAI/Dropstone applications that handles version management, downloads, and updates for different platforms and qualities.

## Features

- **Version Management**: Store and manage different versions for various platforms
- **Quality Support**: Support for stable, insider, and exploration quality channels
- **Platform Support**: Support for Windows, macOS, and Linux platforms
- **File Upload**: Admin interface for uploading new versions
- **Download Tracking**: Track downloads with SHA256 hashes for integrity
- **RESTful API**: Clean API endpoints for version checking and downloads
- **Health Monitoring**: Built-in health checks and monitoring

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

1. Clone or download the update server files
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment example:
   ```bash
   cp env.example .env
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Public Endpoints

#### Get Latest Version
```
GET /api/latest/:platform/:quality
```

Returns the latest version for a specific platform and quality.

**Parameters:**
- `platform`: Platform identifier (e.g., `server-linux-x64`, `server-darwin`, `server-win32-x64`)
- `quality`: Quality channel (`stable`, `insider`, `exploration`)

**Response:**
```json
{
  "version": "1.0.0",
  "name": "PearAI 1.0.0",
  "timestamp": 1640995200000,
  "url": "/commit:1.0.0/server-linux-x64/stable",
  "sha256hash": "abc123..."
}
```

#### Get Specific Version
```
GET /api/versions/:version/:platform/:quality
```

Returns information about a specific version.

**Parameters:**
- `version`: Version string
- `platform`: Platform identifier
- `quality`: Quality channel

#### Download Version
```
GET /commit::commit/:platform/:quality
```

Downloads the actual binary file for a specific commit/version.

**Parameters:**
- `commit`: Commit hash or version string
- `platform`: Platform identifier
- `quality`: Quality channel

### Admin Endpoints

#### Upload New Version
```
POST /admin/upload
```

Upload a new version file.

**Form Data:**
- `file`: Binary file to upload
- `platform`: Platform identifier
- `quality`: Quality channel
- `version`: Version string
- `name`: Display name

#### List All Versions
```
GET /admin/versions
```

Returns all stored versions.

#### List Latest Versions
```
GET /admin/latest
```

Returns the latest version for each platform/quality combination.

#### Delete Version
```
DELETE /admin/versions/:platform/:quality/:version
```

Deletes a specific version and its associated file.

### Utility Endpoints

#### Health Check
```
GET /health
```

Returns server health status.

#### API Documentation
```
GET /
```

Returns API documentation and available endpoints.

## Platform Identifiers

The server supports the following platform identifiers that match the VS Code CLI expectations:

### Server Platforms
- `server-linux-x64` - Linux x64 server
- `server-linux-arm64` - Linux ARM64 server
- `server-linux-armhf` - Linux ARM32 server
- `server-darwin` - macOS x64 server
- `server-darwin-arm64` - macOS ARM64 server
- `server-win32-x64` - Windows x64 server
- `server-win32-arm64` - Windows ARM64 server

### CLI Platforms
- `cli-linux-x64` - Linux x64 CLI
- `cli-linux-arm64` - Linux ARM64 CLI
- `cli-darwin` - macOS x64 CLI
- `cli-darwin-arm64` - macOS ARM64 CLI
- `cli-win32-x64` - Windows x64 CLI
- `cli-win32-arm64` - Windows ARM64 CLI

### Web Platforms
- `web-linux-x64` - Linux x64 web
- `web-darwin` - macOS x64 web
- `web-win32-x64` - Windows x64 web

## Quality Channels

- `stable` - Stable releases
- `insider` - Insider/development releases
- `exploration` - Experimental releases

## Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: CORS origin settings
- `MAX_FILE_SIZE`: Maximum file upload size

### Directory Structure

```
updates.dropstone.io/
├── data/           # Persistent data storage
│   ├── versions.json
│   ├── latest.json
│   └── downloads.json
├── downloads/      # Binary files storage
├── uploads/        # Temporary upload storage
├── public/         # Static files
├── server.js       # Main server file
├── package.json    # Dependencies
└── README.md       # This file
```

## Usage Examples

### Upload a New Version

Using curl:
```bash
curl -X POST http://localhost:3000/admin/upload \
  -F "file=@pearai-server-linux-x64.tar.gz" \
  -F "platform=server-linux-x64" \
  -F "quality=stable" \
  -F "version=1.0.0" \
  -F "name=PearAI 1.0.0"
```

### Check for Updates

Using curl:
```bash
curl http://localhost:3000/api/latest/server-linux-x64/stable
```

### Download Latest Version

Using curl:
```bash
curl -O http://localhost:3000/commit:1.0.0/server-linux-x64/stable
```

## Integration with PearAI CLI

To integrate with the PearAI CLI, set the environment variable:

```bash
export VSCODE_CLI_UPDATE_URL=http://updates.dropstone.io
```

Or for development:
```bash
export VSCODE_CLI_UPDATE_URL=http://localhost:3000
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic restarts during development.

### Testing

```bash
npm test
```

## Security Considerations

- The admin endpoints are currently unprotected. In production, implement authentication.
- Consider implementing rate limiting for public endpoints.
- Use HTTPS in production environments.
- Validate uploaded files for security.

## Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Production Considerations

1. Use a reverse proxy (nginx, Apache)
2. Enable HTTPS with SSL certificates
3. Implement authentication for admin endpoints
4. Set up monitoring and logging
5. Configure backup for data directory
6. Use environment variables for configuration

## License

MIT License - see LICENSE file for details.
