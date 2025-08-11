# Distribution Guide - Single Executable Creation

This guide explains how to compile the Quimbi Support Assistant into single executable files for distribution.

## Available Distribution Formats

### 🖥️ **Windows** 
- **File**: `Quimbi Support Assistant Setup 0.1.0.exe` (148 MB)
- **Format**: NSIS installer executable
- **Features**: Complete Windows installer with start menu shortcuts

### 🍎 **macOS**
- **Intel**: `Quimbi Support Assistant-0.1.0.dmg` (196 MB)  
- **Apple Silicon**: `Quimbi Support Assistant-0.1.0-arm64.dmg` (191 MB)
- **Format**: DMG disk images with drag-to-install .app bundles

### 🐧 **Linux** (Available on demand)
- **Format**: AppImage portable executable
- **Features**: Single file, no installation required

## Build Commands

### Quick Build (Current Platform)
```bash
npm run electron:dist
```

### Platform-Specific Builds
```bash
# Windows executable
npm run electron:dist:win

# macOS installer  
npm run electron:dist:mac

# Linux AppImage
npm run electron:dist:linux

# All platforms at once
npm run electron:dist:all
```

## What Gets Created

After running the build commands, you'll find in `dist-electron/`:

```
dist-electron/
├── Quimbi Support Assistant Setup 0.1.0.exe          # Windows installer
├── Quimbi Support Assistant-0.1.0.dmg                # macOS Intel
├── Quimbi Support Assistant-0.1.0-arm64.dmg          # macOS Apple Silicon
└── win-unpacked/                                      # Unpacked Windows app
    └── Quimbi Support Assistant.exe                   # Direct Windows executable
```

## Distribution Options

### 🚀 **Ready-to-Run Executables**

#### Windows Users:
1. Download `Quimbi Support Assistant Setup 0.1.0.exe`
2. Double-click to install
3. App appears in Start Menu and Desktop

#### macOS Users:
1. Download the appropriate `.dmg` file:
   - Intel Macs: `Quimbi Support Assistant-0.1.0.dmg`
   - Apple Silicon: `Quimbi Support Assistant-0.1.0-arm64.dmg`
2. Open the DMG
3. Drag "Quimbi Support Assistant.app" to Applications folder

### 📁 **Portable Version (Windows)**
For users who prefer not to install:
- Use `dist-electron/win-unpacked/Quimbi Support Assistant.exe`
- This is a portable executable that runs without installation
- Requires only the unpacked folder structure to be preserved

## File Sizes & Requirements

| Platform | File Size | Installation Size | Requirements |
|----------|-----------|-------------------|--------------|
| Windows  | 148 MB    | ~300 MB          | Windows 10+ |
| macOS Intel | 196 MB | ~400 MB          | macOS 10.15+ |
| macOS ARM | 191 MB   | ~400 MB          | macOS 11+ (Apple Silicon) |

## What's Included in Each Build

Every executable contains:
- ✅ Complete Next.js application with all 23 routes
- ✅ All React components (26 components)
- ✅ Full Ollama integration and AI processing
- ✅ API routes and backend functionality
- ✅ Native desktop features (menus, shortcuts)
- ✅ Automatic server management
- ✅ All existing web functionality

## Zero Dependencies

Users only need to:
1. Download the appropriate file for their platform
2. Install/run the executable
3. **That's it!** No Node.js, npm, or complex setup required

## Advanced Configuration

### Code Signing (For Official Distribution)

To remove "Unknown Developer" warnings:

```bash
# macOS: Requires Apple Developer certificate
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate_password"

# Windows: Requires code signing certificate
export WIN_CSC_LINK="path/to/certificate.p12"
export WIN_CSC_KEY_PASSWORD="certificate_password"
```

### Custom Build Configuration

Edit `package.json` build section:

```json
"build": {
  "appId": "com.yourcompany.quimbi-support",
  "productName": "Your Custom Name",
  "directories": {
    "output": "custom-dist"
  }
}
```

## Testing the Executables

### Windows
```bash
# Test the installer
./dist-electron/"Quimbi Support Assistant Setup 0.1.0.exe"

# Or run portable version
./dist-electron/win-unpacked/"Quimbi Support Assistant.exe"
```

### macOS
```bash
# Mount and test the DMG
open "dist-electron/Quimbi Support Assistant-0.1.0.dmg"
```

## Troubleshooting

### Build Issues
- **Wine required for Windows builds on macOS**: Automatically downloaded
- **Missing native dependencies**: Run `npm install` first
- **Disk space**: Ensure 2GB+ free space for builds

### Runtime Issues
- **Port conflicts**: App automatically finds available ports
- **Ollama not found**: Executable includes Ollama installation scripts
- **Performance**: First launch may be slower while extracting files

## Distribution Strategy

### Internal Distribution
- Share the executable files directly
- No cloud setup or complex installation procedures
- Users can run immediately after download

### Public Distribution
- Consider code signing certificates for trust
- Use proper download hosting (GitHub Releases, etc.)
- Provide checksums for security verification

---

**Result**: Instead of requiring users to run complex installation scripts, they now simply download and run a single executable file. The entire Quimbi Support Assistant experience is packaged into these self-contained applications.