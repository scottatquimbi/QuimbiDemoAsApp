#!/bin/bash

# Create macOS .app bundle for Quimbi Preparation Tool
# This makes it clickable from Finder without needing Terminal knowledge

set -e

echo "🍎 Creating macOS .app bundle for Quimbi Preparation Tool..."

# App bundle name and paths
APP_NAME="Prepare Quimbi for macOS"
APP_BUNDLE="dist/${APP_NAME}.app"
CONTENTS_DIR="${APP_BUNDLE}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

# Clean up any existing bundle
if [ -d "$APP_BUNDLE" ]; then
    echo "🗑️  Removing existing app bundle..."
    rm -rf "$APP_BUNDLE"
fi

# Create app bundle directory structure
echo "📁 Creating app bundle structure..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create Info.plist
echo "📄 Creating Info.plist..."
cat > "${CONTENTS_DIR}/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>Prepare Quimbi for macOS</string>
    <key>CFBundleExecutable</key>
    <string>prepare-quimbi-launcher</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>ai.quimbi.preparation-tool</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Prepare Quimbi for macOS</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.utilities</string>
    <key>CFBundleDocumentTypes</key>
    <array></array>
    <key>NSHumanReadableCopyright</key>
    <string>© 2025 Quimbi AI. All rights reserved.</string>
</dict>
</plist>
EOF

# Create the main launcher script that opens Terminal
echo "🚀 Creating launcher script..."
cat > "${MACOS_DIR}/prepare-quimbi-launcher" << 'EOF'
#!/bin/bash

# Launcher script for Quimbi Preparation Tool
# This opens Terminal and runs the preparation tool with a nice interface

# Get the directory where this app bundle is located
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_PATH="$APP_DIR/prepare-quimbi-macos"

# Check if the preparation script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    # Try to find it in the same directory as the app bundle
    SCRIPT_PATH="$(dirname "$APP_DIR")/prepare-quimbi-macos"
    
    if [ ! -f "$SCRIPT_PATH" ]; then
        osascript -e 'display alert "Quimbi Preparation Tool" message "Could not find the preparation script. Please ensure prepare-quimbi-macos is in the same folder as this app." as critical'
        exit 1
    fi
fi

# Create a temporary script that will run in Terminal
TEMP_SCRIPT="/tmp/quimbi-prep-$$.sh"
cat > "$TEMP_SCRIPT" << INNER_EOF
#!/bin/bash

# Quimbi Preparation Tool - Terminal Interface
clear
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    🤖 Quimbi Preparation Tool for macOS                     ║"
echo "║                                                                              ║"
echo "║  This tool will prepare your Mac to run the Quimbi Support Assistant by:    ║"
echo "║                                                                              ║"
echo "║  ✅ Installing Ollama AI runtime (if needed)                                ║"
echo "║  ✅ Downloading llama3.1:8b model (~4.7GB, if needed)                      ║"
echo "║  ✅ Verifying everything works correctly                                    ║"
echo "║                                                                              ║"
echo "║  Requirements:                                                               ║"
echo "║  • macOS 10.15 or later                                                     ║"
echo "║  • 8GB+ free disk space                                                     ║"
echo "║  • Internet connection                                                       ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Ask user if they want to proceed
read -p "🚀 Press Enter to begin preparation, or type 'cancel' to exit: " response

if [[ "\$response" == "cancel" ]] || [[ "\$response" == "c" ]]; then
    echo ""
    echo "❌ Preparation cancelled by user."
    echo ""
    read -p "Press Enter to close this window..."
    exit 0
fi

echo ""
echo "🔄 Starting Quimbi preparation process..."
echo ""

# Run the actual preparation tool with verbose output for better user experience
"$SCRIPT_PATH" --verbose

# Capture the exit code
PREP_EXIT_CODE=\$?

echo ""
if [ \$PREP_EXIT_CODE -eq 0 ]; then
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          🎉 SUCCESS! Ready for Quimbi!                      ║"
    echo "║                                                                              ║"
    echo "║  Your Mac is now prepared to run the Quimbi Support Assistant!             ║"
    echo "║                                                                              ║"
    echo "║  Next steps:                                                                 ║"
    echo "║  1. Close this window                                                        ║"
    echo "║  2. Run 'Quimbi Support Assistant.app'                                      ║"
    echo "║                                                                              ║"
    echo "║  The AI will now work smoothly with llama3.1:8b model ready to go!         ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
else
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          ❌ Preparation Failed                               ║"
    echo "║                                                                              ║"
    echo "║  Something went wrong during the preparation process.                        ║"
    echo "║                                                                              ║"
    echo "║  Possible solutions:                                                         ║"
    echo "║  • Check your internet connection                                           ║"
    echo "║  • Ensure you have enough disk space (8GB+)                                ║"
    echo "║  • Try running this tool again                                              ║"
    echo "║  • Contact support if the problem persists                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
fi

echo ""
read -p "Press Enter to close this window..."

# Clean up the temporary script
rm -f "$TEMP_SCRIPT"
INNER_EOF

chmod +x "$TEMP_SCRIPT"

# Open Terminal and run the script
osascript << APPLESCRIPT
tell application "Terminal"
    activate
    do script "bash '$TEMP_SCRIPT'"
end tell
APPLESCRIPT
EOF

chmod +x "${MACOS_DIR}/prepare-quimbi-launcher"

# Copy the actual preparation executables into the app bundle
echo "📦 Copying preparation executables..."
cp "prepare-quimbi-macos" "$APP_BUNDLE/" 2>/dev/null || cp "dist/prepare-quimbi-macos" "$APP_BUNDLE/"
cp "prepare-quimbi-macos-arm64" "$APP_BUNDLE/" 2>/dev/null || cp "dist/prepare-quimbi-macos-arm64" "$APP_BUNDLE/"
cp "prepare-quimbi-macos-x64" "$APP_BUNDLE/" 2>/dev/null || cp "dist/prepare-quimbi-macos-x64" "$APP_BUNDLE/"

# Create a simple app icon (text-based icon since we don't have a proper icon file)
echo "🎨 Creating app icon..."
# Note: This creates a simple text-based icon. For a real icon, you'd need a proper .icns file
cat > "${RESOURCES_DIR}/AppIcon.icns" << 'EOF'
# Placeholder for app icon
# In a real deployment, this would be a proper .icns file
# For now, macOS will use a default application icon
EOF

# Create usage instructions
echo "📖 Creating usage instructions..."
cat > "${APP_BUNDLE}/HOW-TO-USE.txt" << 'EOF'
# How to Use Prepare Quimbi for macOS

## Simple Method (No Terminal Required)
1. Double-click "Prepare Quimbi for macOS.app"
2. Terminal will open automatically with a friendly interface
3. Press Enter when prompted to begin
4. Wait for the process to complete
5. You'll see "Ready for Quimbi!" when done

## What It Does
- Installs Ollama AI runtime (if not already installed)
- Downloads the llama3.1:8b model (~4.7GB)
- Verifies everything works correctly
- Prepares your Mac to run Quimbi Support Assistant

## Requirements
- macOS 10.15 or later
- 8GB+ free disk space
- Internet connection

## Troubleshooting
If the app doesn't open:
1. Right-click the app and select "Open"
2. Click "Open" when macOS asks about opening an unsigned app
3. If it still doesn't work, open Terminal manually and run:
   ./prepare-quimbi-macos

## Files in this folder
- "Prepare Quimbi for macOS.app" - The clickable application
- prepare-quimbi-macos - Universal command-line version
- prepare-quimbi-macos-arm64 - Apple Silicon version
- prepare-quimbi-macos-x64 - Intel Mac version
EOF

echo ""
echo "✅ macOS app bundle created successfully!"
echo ""
echo "📁 Created: $APP_BUNDLE"
echo ""
echo "🎯 Usage for end users:"
echo "   1. Double-click 'Prepare Quimbi for macOS.app'"
echo "   2. Terminal opens automatically with a user-friendly interface"
echo "   3. Follow the prompts - no technical knowledge required!"
echo ""
echo "📋 What happens when users double-click:"
echo "   • Opens Terminal automatically"
echo "   • Shows a nice welcome message with instructions"
echo "   • Runs the preparation tool with verbose output"
echo "   • Shows clear success/failure messages"
echo "   • Prompts user to press Enter to close"
echo ""
echo "🔧 To distribute:"
echo "   • Share the entire 'dist' folder"
echo "   • Users can double-click the .app file"
echo "   • No Terminal knowledge required!"
echo ""

# Make the app bundle executable (in case it's needed)
chmod -R 755 "$APP_BUNDLE"

echo "🎉 Ready! Users can now simply double-click the app to prepare their Mac for Quimbi!"