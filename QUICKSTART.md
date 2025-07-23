# Quick Start Guide

Get the Dropstone Update Server running in minutes!

## Prerequisites

- Node.js 18+ (for development)
- Docker & Docker Compose (for production)

## Option 1: Docker (Recommended)

### 1. Clone/Download the Update Server
```bash
# If you have the files locally
cd updates.dropstone.io

# Or clone from your repository
git clone <your-repo>
cd updates.dropstone.io
```

### 2. Start the Server
```bash
# Make the deployment script executable (Linux/macOS)
chmod +x deploy.sh

# Setup and start
./deploy.sh setup
./deploy.sh start
```

### 3. Verify it's Working
```bash
# Check status
./deploy.sh status

# Or visit the admin interface
open http://localhost:3000
```

## Option 2: Development Mode

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test the Server
```bash
npm test
```

## Upload Your First Update

### Using the Web Interface

1. Open http://localhost:3000
2. Click "Upload Version" tab
3. Fill in the form:
   - **Platform**: `server-linux-x64`
   - **Quality**: `stable`
   - **Version**: `1.0.0`
   - **Name**: `PearAI 1.0.0`
   - **File**: Upload your binary file
4. Click "Upload Version"

### Using curl

```bash
curl -X POST http://localhost:3000/admin/upload \
  -F "file=@your-pearai-binary.tar.gz" \
  -F "platform=server-linux-x64" \
  -F "quality=stable" \
  -F "version=1.0.0" \
  -F "name=PearAI 1.0.0"
```

### Using the Deployment Script

```bash
./deploy.sh upload-sample
```

## Test the Update API

```bash
# Check health
curl http://localhost:3000/health

# Get latest version
curl http://localhost:3000/api/latest/server-linux-x64/stable

# Download the update
curl -O http://localhost:3000/commit:1.0.0/server-linux-x64/stable
```

## Configure PearAI CLI

Set the environment variable to point to your update server:

```bash
# For development
export VSCODE_CLI_UPDATE_URL=http://localhost:3000

# For production
export VSCODE_CLI_UPDATE_URL=https://updates.dropstone.io
```

## Test PearAI Updates

```bash
# Check for updates
pearai update --check

# Update the CLI
pearai update
```

## Production Deployment

### 1. Domain Setup
Configure DNS for `updates.dropstone.io` to point to your server.

### 2. SSL Certificate
Obtain SSL certificate and place in `ssl/` directory:
```bash
mkdir ssl
# Place cert.pem and key.pem in ssl/
```

### 3. Start Production Mode
```bash
./deploy.sh prod
```

### 4. Configure Environment
```bash
export VSCODE_CLI_UPDATE_URL=https://updates.dropstone.io
```

## Troubleshooting

### Server Won't Start
```bash
# Check logs
./deploy.sh logs

# Check status
./deploy.sh status

# Restart
./deploy.sh restart
```

### Upload Fails
- Check file size (max 500MB)
- Verify file format (tar.gz, zip, etc.)
- Check server logs

### PearAI Can't Connect
```bash
# Test connectivity
curl http://localhost:3000/health

# Check environment variable
echo $VSCODE_CLI_UPDATE_URL

# Test API endpoint
curl http://localhost:3000/api/latest/server-linux-x64/stable
```

## Next Steps

1. **Read the full documentation**: See `README.md`
2. **Learn about integration**: See `INTEGRATION.md`
3. **Customize the server**: Modify `server.js`
4. **Add authentication**: Implement auth for admin endpoints
5. **Set up monitoring**: Configure logging and alerts

## Support

- Check the logs: `./deploy.sh logs`
- Run tests: `npm test`
- View admin interface: http://localhost:3000
- Read documentation: `README.md`

That's it! Your update server is ready to serve PearAI updates. 🚀
