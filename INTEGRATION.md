# PearAI CLI Integration Guide

This guide explains how to integrate the PearAI CLI with the Dropstone Update Server.

## Overview

The PearAI CLI uses the VS Code CLI update mechanism to check for and download updates. By configuring the update endpoint, you can point the CLI to your custom update server.

## Configuration

### Environment Variable

Set the `VSCODE_CLI_UPDATE_URL` environment variable to point to your update server:

```bash
# For production
export VSCODE_CLI_UPDATE_URL=https://updates.dropstone.io

# For development
export VSCODE_CLI_UPDATE_URL=http://localhost:3000

# For Windows PowerShell
$env:VSCODE_CLI_UPDATE_URL="https://updates.dropstone.io"

# For Windows Command Prompt
set VSCODE_CLI_UPDATE_URL=https://updates.dropstone.io
```

### Permanent Configuration

#### Linux/macOS
Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
```bash
export VSCODE_CLI_UPDATE_URL=https://updates.dropstone.io
```

#### Windows
Add to your system environment variables or PowerShell profile:
```powershell
[Environment]::SetEnvironmentVariable("VSCODE_CLI_UPDATE_URL", "https://updates.dropstone.io", "User")
```

## API Endpoints

The update server provides the following endpoints that the PearAI CLI expects:

### 1. Latest Version Check
```
GET /api/latest/{platform}/{quality}
```

**Example:**
```bash
curl https://updates.dropstone.io/api/latest/server-linux-x64/stable
```

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

### 2. Specific Version Check
```
GET /api/versions/{version}/{platform}/{quality}
```

**Example:**
```bash
curl https://updates.dropstone.io/api/versions/1.0.0/server-linux-x64/stable
```

### 3. Download Binary
```
GET /commit:{commit}/{platform}/{quality}
```

**Example:**
```bash
curl -O https://updates.dropstone.io/commit:1.0.0/server-linux-x64/stable
```

## Platform Identifiers

The CLI expects specific platform identifiers:

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

## Testing Integration

### 1. Check Current Version
```bash
pearai --version
```

### 2. Check for Updates
```bash
pearai update --check
```

### 3. Update CLI
```bash
pearai update
```

### 4. Check Update Status
```bash
pearai status
```

## Uploading Updates

### Using the Admin Interface

1. Start the update server:
   ```bash
   cd updates.dropstone.io
   npm start
   ```

2. Open the admin interface:
   ```
   http://localhost:3000
   ```

3. Upload your binary files through the web interface.

### Using curl

```bash
curl -X POST https://updates.dropstone.io/admin/upload \
  -F "file=@pearai-server-linux-x64.tar.gz" \
  -F "platform=server-linux-x64" \
  -F "quality=stable" \
  -F "version=1.0.0" \
  -F "name=PearAI 1.0.0"
```

### Using the Deployment Script

```bash
cd updates.dropstone.io
./deploy.sh upload-sample
```

## Troubleshooting

### Common Issues

1. **Update server not reachable**
   - Check if the server is running
   - Verify the URL is correct
   - Check firewall settings

2. **SSL/TLS errors**
   - Ensure HTTPS is properly configured
   - Check SSL certificate validity

3. **Version not found**
   - Verify the platform identifier is correct
   - Check if the version was uploaded successfully
   - Ensure the quality channel matches

4. **Download fails**
   - Check file permissions on the server
   - Verify the file exists in the downloads directory
   - Check network connectivity

### Debug Commands

```bash
# Test update server connectivity
curl https://updates.dropstone.io/health

# Check available versions
curl https://updates.dropstone.io/admin/versions

# Test specific version
curl https://updates.dropstone.io/api/versions/1.0.0/server-linux-x64/stable

# Check CLI update configuration
echo $VSCODE_CLI_UPDATE_URL
```

### Logs

Check the update server logs:
```bash
# If using Docker
docker-compose logs update-server

# If running directly
npm run dev
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Authentication**: Consider adding authentication to admin endpoints
3. **Rate Limiting**: The server includes rate limiting for API endpoints
4. **File Validation**: Validate uploaded files for security
5. **Access Control**: Restrict access to admin endpoints

## Production Deployment

1. **Domain Setup**: Configure DNS for `updates.dropstone.io`
2. **SSL Certificate**: Obtain and configure SSL certificate
3. **Reverse Proxy**: Use nginx for production deployment
4. **Monitoring**: Set up monitoring and alerting
5. **Backup**: Configure regular backups of the data directory

## Example Workflow

1. **Build your PearAI binary**
   ```bash
   # Build for different platforms
   cargo build --release --target x86_64-unknown-linux-gnu
   cargo build --release --target aarch64-unknown-linux-gnu
   ```

2. **Package the binary**
   ```bash
   tar -czf pearai-server-linux-x64.tar.gz target/x86_64-unknown-linux-gnu/release/pearai
   tar -czf pearai-server-linux-arm64.tar.gz target/aarch64-unknown-linux-gnu/release/pearai
   ```

3. **Upload to update server**
   ```bash
   curl -X POST https://updates.dropstone.io/admin/upload \
     -F "file=@pearai-server-linux-x64.tar.gz" \
     -F "platform=server-linux-x64" \
     -F "quality=stable" \
     -F "version=1.0.0" \
     -F "name=PearAI 1.0.0"
   ```

4. **Test the update**
   ```bash
   export VSCODE_CLI_UPDATE_URL=https://updates.dropstone.io
   pearai update --check
   pearai update
   ```

This integration allows you to maintain full control over your PearAI updates while providing a seamless update experience for your users.
