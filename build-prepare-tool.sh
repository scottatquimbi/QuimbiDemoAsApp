#!/bin/bash

# Build script for Quimbi macOS Preparation Tool
# Creates a standalone executable that doesn't require Node.js to be installed

set -e

echo "🤖 Building Quimbi macOS Preparation Tool..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Check if pkg is installed globally, if not install it temporarily
if ! command -v pkg &> /dev/null; then
    echo "📦 Installing pkg (Node.js packager)..."
    npm install -g pkg
fi

# Build the standalone executable
echo "🔨 Compiling standalone executable..."
pkg prepare-macos.js \
    --target node18-macos-arm64 \
    --output dist/prepare-quimbi-macos-arm64 \
    --compress GZip

# Also build for Intel Macs for compatibility
echo "🔨 Compiling for Intel Macs..."
pkg prepare-macos.js \
    --target node18-macos-x64 \
    --output dist/prepare-quimbi-macos-x64 \
    --compress GZip

# Create a universal script that detects architecture
echo "🔧 Creating universal launcher..."
cat > dist/prepare-quimbi-macos << 'EOF'
#!/bin/bash

# Universal launcher for Quimbi macOS Preparation Tool
# Automatically detects architecture and runs the appropriate binary

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCH=$(uname -m)

if [[ "$ARCH" == "arm64" ]]; then
    echo "🍎 Detected Apple Silicon Mac (ARM64)"
    exec "$SCRIPT_DIR/prepare-quimbi-macos-arm64" "$@"
elif [[ "$ARCH" == "x86_64" ]]; then
    echo "💻 Detected Intel Mac (x86_64)"
    exec "$SCRIPT_DIR/prepare-quimbi-macos-x64" "$@"
else
    echo "❌ Unsupported architecture: $ARCH"
    echo "This tool only supports macOS on Intel and Apple Silicon"
    exit 1
fi
EOF

chmod +x dist/prepare-quimbi-macos

# Make all executables runnable
chmod +x dist/prepare-quimbi-macos-*

# Create a README for the dist folder
cat > dist/README.md << 'EOF'
# Quimbi macOS Preparation Tool

This folder contains standalone executables that prepare any macOS computer to run the Quimbi Support Assistant.

## Files

- `prepare-quimbi-macos` - Universal launcher (detects your Mac type automatically)
- `prepare-quimbi-macos-arm64` - For Apple Silicon Macs (M1, M2, M3, etc.)
- `prepare-quimbi-macos-x64` - For Intel Macs

## Usage

### Option 1: Universal (Recommended)
```bash
./prepare-quimbi-macos
```

### Option 2: Architecture-specific
```bash
# For Apple Silicon Macs
./prepare-quimbi-macos-arm64

# For Intel Macs  
./prepare-quimbi-macos-x64
```

### Options
```bash
./prepare-quimbi-macos --verbose    # Show detailed output
./prepare-quimbi-macos --force      # Force reinstall even if already installed
./prepare-quimbi-macos --help       # Show help
```

## What it does

1. ✅ Checks if Ollama is installed (installs if missing)
2. ✅ Downloads llama3.1:8b model (required for Quimbi)
3. ✅ Verifies everything is working
4. ✅ Shows "Ready for Quimbi!" when complete

## Requirements

- macOS 10.15 or later
- 8GB+ disk space (for AI model)
- Internet connection (for downloads)

No Node.js or other dependencies required - these are standalone executables.
EOF

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Created files in dist/:"
ls -la dist/
echo ""
echo "🚀 To test the tool:"
echo "   cd dist"
echo "   ./prepare-quimbi-macos --help"
echo ""
echo "📋 To distribute:"
echo "   - Share the entire 'dist' folder, or"
echo "   - Share just 'prepare-quimbi-macos' (universal launcher) + both architecture-specific binaries"
echo ""
echo "🎯 End users can run: ./prepare-quimbi-macos"
echo "   This will install Ollama and llama3.1:8b model, then show 'Ready for Quimbi!'"