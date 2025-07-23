# PearAI Binary Build Guide

This guide explains how to build your PearAI CLI binary and prepare it for the update server.

## Prerequisites

- **Rust** (latest stable version)
- **Cargo** (comes with Rust)
- **Git** (for cloning the repository)

## Building the PearAI CLI

### 1. Navigate to the CLI Directory

```bash
cd cli
```

### 2. Build for Your Current Platform

```bash
# Build in release mode (optimized)
cargo build --release

# The binary will be created at:
# Windows: target/release/code.exe
# Linux/macOS: target/release/code
```

### 3. Build for Multiple Platforms

You can build for different platforms using cross-compilation:

#### **Windows x64**
```bash
# Install Windows target
rustup target add x86_64-pc-windows-msvc

# Build for Windows
cargo build --release --target x86_64-pc-windows-msvc
# Binary: target/x86_64-pc-windows-msvc/release/code.exe
```

#### **Linux x64**
```bash
# Install Linux target
rustup target add x86_64-unknown-linux-gnu

# Build for Linux
cargo build --release --target x86_64-unknown-linux-gnu
# Binary: target/x86_64-unknown-linux-gnu/release/code
```

#### **macOS x64**
```bash
# Install macOS target
rustup target add x86_64-apple-darwin

# Build for macOS
cargo build --release --target x86_64-apple-darwin
# Binary: target/x86_64-apple-darwin/release/code
```

#### **Linux ARM64**
```bash
# Install ARM64 Linux target
rustup target add aarch64-unknown-linux-gnu

# Build for ARM64 Linux
cargo build --release --target aarch64-unknown-linux-gnu
# Binary: target/aarch64-unknown-linux-gnu/release/code
```

#### **macOS ARM64**
```bash
# Install ARM64 macOS target
rustup target add aarch64-apple-darwin

# Build for ARM64 macOS
cargo build --release --target aarch64-apple-darwin
# Binary: target/aarch64-apple-darwin/release/code
```

## Preparing Binaries for Upload

### 1. Create Archive Files

After building, create compressed archives for each platform:

#### **Windows**
```bash
# Create a directory for the Windows binary
mkdir pearai-windows-x64
cp cli/target/x86_64-pc-windows-msvc/release/code.exe pearai-windows-x64/pearai.exe

# Create ZIP archive
zip -r pearai-server-win32-x64.zip pearai-windows-x64/

# Or create tar.gz (if you prefer)
tar -czf pearai-server-win32-x64.tar.gz pearai-windows-x64/
```

#### **Linux x64**
```bash
# Create a directory for the Linux binary
mkdir pearai-linux-x64
cp cli/target/x86_64-unknown-linux-gnu/release/code pearai-linux-x64/pearai

# Make it executable
chmod +x pearai-linux-x64/pearai

# Create tar.gz archive
tar -czf pearai-server-linux-x64.tar.gz pearai-linux-x64/
```

#### **macOS x64**
```bash
# Create a directory for the macOS binary
mkdir pearai-macos-x64
cp cli/target/x86_64-apple-darwin/release/code pearai-macos-x64/pearai

# Make it executable
chmod +x pearai-macos-x64/pearai

# Create tar.gz archive
tar -czf pearai-server-darwin.tar.gz pearai-macos-x64/
```

#### **Linux ARM64**
```bash
# Create a directory for the ARM64 Linux binary
mkdir pearai-linux-arm64
cp cli/target/aarch64-unknown-linux-gnu/release/code pearai-linux-arm64/pearai

# Make it executable
chmod +x pearai-linux-arm64/pearai

# Create tar.gz archive
tar -czf pearai-server-linux-arm64.tar.gz pearai-linux-arm64/
```

#### **macOS ARM64**
```bash
# Create a directory for the ARM64 macOS binary
mkdir pearai-macos-arm64
cp cli/target/aarch64-apple-darwin/release/code pearai-macos-arm64/pearai

# Make it executable
chmod +x pearai-macos-arm64/pearai

# Create tar.gz archive
tar -czf pearai-server-darwin-arm64.tar.gz pearai-macos-arm64/
```

### 2. Automated Build Script

Create a build script to automate the process:

```bash
#!/bin/bash
# build-pearai.sh

set -e

echo "Building PearAI binaries for all platforms..."

# Build for all targets
echo "Building for Windows x64..."
cargo build --release --target x86_64-pc-windows-msvc

echo "Building for Linux x64..."
cargo build --release --target x86_64-unknown-linux-gnu

echo "Building for macOS x64..."
cargo build --release --target x86_64-apple-darwin

echo "Building for Linux ARM64..."
cargo build --release --target aarch64-unknown-linux-gnu

echo "Building for macOS ARM64..."
cargo build --release --target aarch64-apple-darwin

# Create archives
echo "Creating archives..."

# Windows
mkdir -p dist/pearai-windows-x64
cp target/x86_64-pc-windows-msvc/release/code.exe dist/pearai-windows-x64/pearai.exe
cd dist
zip -r pearai-server-win32-x64.zip pearai-windows-x64/
cd ..

# Linux x64
mkdir -p dist/pearai-linux-x64
cp target/x86_64-unknown-linux-gnu/release/code dist/pearai-linux-x64/pearai
chmod +x dist/pearai-linux-x64/pearai
cd dist
tar -czf pearai-server-linux-x64.tar.gz pearai-linux-x64/
cd ..

# macOS x64
mkdir -p dist/pearai-macos-x64
cp target/x86_64-apple-darwin/release/code dist/pearai-macos-x64/pearai
chmod +x dist/pearai-macos-x64/pearai
cd dist
tar -czf pearai-server-darwin.tar.gz pearai-macos-x64/
cd ..

# Linux ARM64
mkdir -p dist/pearai-linux-arm64
cp target/aarch64-unknown-linux-gnu/release/code dist/pearai-linux-arm64/pearai
chmod +x dist/pearai-linux-arm64/pearai
cd dist
tar -czf pearai-server-linux-arm64.tar.gz pearai-linux-arm64/
cd ..

# macOS ARM64
mkdir -p dist/pearai-macos-arm64
cp target/aarch64-apple-darwin/release/code dist/pearai-macos-arm64/pearai
chmod +x dist/pearai-macos-arm64/pearai
cd dist
tar -czf pearai-server-darwin-arm64.tar.gz pearai-macos-arm64/
cd ..

echo "Build complete! Archives are in the dist/ directory."
ls -la dist/
```

Make it executable and run:
```bash
chmod +x build-pearai.sh
./build-pearai.sh
```

## Uploading to Update Server

### 1. Using the Web Interface

1. Start the update server:
   ```bash
   cd updates.dropstone.io
   npm start
   ```

2. Open http://localhost:3000

3. Upload each binary:
   - **Windows**: Upload `pearai-server-win32-x64.zip` with platform `server-win32-x64`
   - **Linux**: Upload `pearai-server-linux-x64.tar.gz` with platform `server-linux-x64`
   - **macOS**: Upload `pearai-server-darwin.tar.gz` with platform `server-darwin`

### 2. Using curl

```bash
# Upload Windows version
curl -X POST http://localhost:3000/admin/upload \
  -F "file=@dist/pearai-server-win32-x64.zip" \
  -F "platform=server-win32-x64" \
  -F "quality=stable" \
  -F "version=1.0.0" \
  -F "name=PearAI 1.0.0"

# Upload Linux version
curl -X POST http://localhost:3000/admin/upload \
  -F "file=@dist/pearai-server-linux-x64.tar.gz" \
  -F "platform=server-linux-x64" \
  -F "quality=stable" \
  -F "version=1.0.0" \
  -F "name=PearAI 1.0.0"

# Upload macOS version
curl -X POST http://localhost:3000/admin/upload \
  -F "file=@dist/pearai-server-darwin.tar.gz" \
  -F "platform=server-darwin" \
  -F "quality=stable" \
  -F "version=1.0.0" \
  -F "name=PearAI 1.0.0"
```

### 3. Using the Deployment Script

```bash
# Upload all versions at once
cd updates.dropstone.io
./deploy.sh upload-sample
```

## Platform Identifiers

Use these exact platform identifiers when uploading:

| Platform | Identifier | Binary Location |
|----------|------------|-----------------|
| Windows x64 | `server-win32-x64` | `target/x86_64-pc-windows-msvc/release/code.exe` |
| Linux x64 | `server-linux-x64` | `target/x86_64-unknown-linux-gnu/release/code` |
| macOS x64 | `server-darwin` | `target/x86_64-apple-darwin/release/code` |
| Linux ARM64 | `server-linux-arm64` | `target/aarch64-unknown-linux-gnu/release/code` |
| macOS ARM64 | `server-darwin-arm64` | `target/aarch64-apple-darwin/release/code` |

## Quality Channels

- `stable` - Production releases
- `insider` - Development/insider releases
- `exploration` - Experimental releases

## Testing Your Binary

After uploading, test that the update works:

```bash
# Set the update server URL
export VSCODE_CLI_UPDATE_URL=http://localhost:3000

# Check for updates
pearai update --check

# Update the CLI
pearai update
```

## Troubleshooting

### Build Issues
- Ensure you have the correct Rust toolchain: `rustup show`
- Install missing targets: `rustup target add <target>`
- Check Cargo.toml for dependencies

### Upload Issues
- Verify file size (max 500MB)
- Check file format (tar.gz, zip)
- Ensure platform identifier is correct
- Check server logs for errors

### Update Issues
- Verify environment variable is set: `echo $VSCODE_CLI_UPDATE_URL`
- Test server connectivity: `curl http://localhost:3000/health`
- Check binary permissions and format

## Production Workflow

1. **Build binaries** for all target platforms
2. **Create archives** (tar.gz or zip)
3. **Upload to update server** with correct platform identifiers
4. **Test updates** on each platform
5. **Deploy to production** update server

This workflow ensures your PearAI users get the latest updates automatically!
