# External URL Updates for Dropstone

This feature allows you to push updates to users by providing external download URLs instead of uploading files directly to the update server.

## Quick Start

### 1. Start the Update Server

```bash
cd updates.dropstone.io
npm install
npm start
```

### 2. Add Your External URL

#### Option A: Using the Web Dashboard
1. Open `http://localhost:3000` in your browser
2. Use the "Quick Add External URL" section
3. Your URL is pre-filled: `https://downloads-dropstone.netlify.app/Dropstone%20Setup%20Installer%20(v1.96.4%20Stable).exe`
4. Select the platform (Windows x64 CLI)
5. Click "Add Update"

#### Option B: Using the Quick Script
```bash
# Use default values (your URL)
node quick-add.js

# Or specify custom values
node quick-add.js "https://your-url.com/file.exe" cli-win32-x64 stable 1.96.4 "PearAI 1.96.4"
```

#### Option C: Using curl
```bash
curl -X POST http://localhost:3000/admin/add-external \
  -H "Content-Type: application/json" \
  -d '{
    "externalUrl": "https://downloads-dropstone.netlify.app/Dropstone%20Setup%20Installer%20(v1.96.4%20Stable).exe",
    "platform": "cli-win32-x64",
    "quality": "stable",
    "version": "1.96.4",
    "name": "PearAI 1.96.4"
  }'
```

## How It Works

1. **External URL Storage**: The update server stores your external download URL
2. **Update Check**: When users run `dropstone update --check`, the CLI checks the update server
3. **Redirect Download**: When users run `dropstone update`, the CLI downloads from your external URL
4. **Automatic Update**: The CLI replaces itself with the downloaded executable

## Supported Platforms

- `cli-win32-x64` - Windows x64 CLI
- `cli-win32-arm64` - Windows ARM64 CLI
- `cli-darwin` - macOS x64 CLI
- `cli-darwin-arm64` - macOS ARM64 CLI
- `cli-linux-x64` - Linux x64 CLI
- `cli-linux-arm64` - Linux ARM64 CLI

## Quality Channels

- `stable` - Stable releases (recommended)
- `insider` - Development releases
- `exploration` - Experimental releases

## Your Current Setup

Your executable is hosted at:
```
https://downloads-dropstone.netlify.app/Dropstone%20Setup%20Installer%20(v1.96.4%20Stable).exe
```

This URL will be used to push updates to Windows users.

## Testing the Update

1. **Set the update server URL**:
   ```bash
   export VSCODE_CLI_UPDATE_URL=http://localhost:3000
   ```

2. **Check for updates**:
   ```bash
   dropstone update --check
   ```

3. **Update the CLI**:
   ```bash
   dropstone update
   ```

## Adding Multiple Platforms

To add your executable for different platforms:

```bash
# Windows x64
node quick-add.js "https://downloads-dropstone.netlify.app/Dropstone%20Setup%20Installer%20(v1.96.4%20Stable).exe" cli-win32-x64 stable 1.96.4 "Dropstone 1.96.4"

# macOS (if you have a .app file)
node quick-add.js "https://your-macos-url.com/Dropstone.app" cli-darwin stable 1.96.4 "Dropstone 1.96.4"

# Linux (if you have a Linux binary)
node quick-add.js "https://your-linux-url.com/dropstone-linux-x64" cli-linux-x64 stable 1.96.4 "Dropstone 1.96.4"
```

## Managing Updates

### View Current Versions
```bash
curl http://localhost:3000/admin/versions
```

### Delete a Version
```bash
curl -X DELETE http://localhost:3000/admin/versions/cli-win32-x64/stable/1.96.4
```

### Check Latest Versions
```bash
curl http://localhost:3000/admin/latest
```

## Production Deployment

1. **Deploy the update server** to your production domain
2. **Update the environment variable**:
   ```bash
   export VSCODE_CLI_UPDATE_URL=https://your-update-server.com
   ```
3. **Add your external URLs** using the production server
4. **Test the updates** on each platform

## Benefits of External URLs

✅ **No File Upload**: Don't need to upload large files to the update server
✅ **CDN Support**: Use your existing CDN (Netlify, CloudFlare, etc.)
✅ **Version Control**: Easy to manage different versions
✅ **Automatic Updates**: Users get updates automatically
✅ **Flexible Hosting**: Host files anywhere (GitHub, S3, etc.)

## Troubleshooting

### Update Server Issues
```bash
# Check server health
curl http://localhost:3000/health

# Check server logs
npm run dev
```

### CLI Update Issues
```bash
# Check update URL
echo $VSCODE_CLI_UPDATE_URL

# Test update server connectivity
curl $VSCODE_CLI_UPDATE_URL/health

# Check for updates manually
dropstone update --check
```

### External URL Issues
- Ensure the URL is publicly accessible
- Check that the file can be downloaded
- Verify the URL doesn't require authentication
- Test the download in a browser

## Example Workflow

1. **Build your executable** and upload to your hosting service
2. **Get the public URL** for the executable
3. **Add to update server**:
   ```bash
   node quick-add.js "https://your-url.com/dropstone.exe" cli-win32-x64 stable 1.96.4 "Dropstone 1.96.4"
   ```
4. **Users get updates automatically** when they run `dropstone update`

This setup gives you complete control over your update distribution while providing a seamless experience for your users!
