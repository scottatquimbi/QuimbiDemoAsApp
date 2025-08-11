# Quimbi Support Assistant - Desktop App

Desktop version of the Quimbi AI customer support system, built with Electron.

## Features

- **Native Desktop Experience**: Full-featured desktop application with native OS integration
- **Local AI Processing**: Powered entirely by Ollama using llama3.1 models
- **Zero External Dependencies**: Complete functionality without internet connection
- **All Web Features**: Includes automated support flow, three-part response system, and admin panel

## Quick Start

### Development Mode
```bash
# Start development version (with hot reload)
npm run electron

# Or run web and electron separately for better debugging
npm run electron:dev
```

### Building the App
```bash
# Build for distribution (creates installer/dmg)
npm run electron:dist

# Build for testing (creates app bundle only)
npm run electron:pack
```

## Desktop App Structure

```
electron/
├── main.js          # Main Electron process
└── preload.js       # Renderer preload script

dist-electron/       # Built desktop app output
└── mac-arm64/
    └── Quimbi Support Assistant.app
```

## Key Desktop Features

### Window Management
- Resizable window (min: 800x600)
- Native titlebar integration
- Proper window state management

### Menu System
- **File**: New Chat, Exit
- **View**: Reload, Developer Tools, Zoom controls
- **Support**: Quick navigation to Demo, Automated Support, Admin Panel
- **Help**: About dialog, Ollama status check

### Native Integration
- System notifications (planned)
- File system access for exports
- Proper app icons and metadata

### Server Management
- Automatic Next.js server startup/shutdown
- Port conflict resolution
- Graceful error handling

## Development Workflow

1. **Web Development**: Continue using `npm run dev` for web development
2. **Desktop Testing**: Use `npm run electron` to test desktop features
3. **Building**: Use `npm run electron:pack` for testing builds
4. **Distribution**: Use `npm run electron:dist` for final releases

## Configuration

The desktop app automatically:
- Starts Next.js server on available port
- Loads the web interface in Electron window
- Preserves all existing functionality
- Handles server lifecycle management

## Platform Support

Currently configured for:
- **macOS**: DMG installer (x64 + ARM64)
- **Windows**: NSIS installer (x64)
- **Linux**: AppImage (x64)

## File Structure

The Electron app bundles:
- Complete Next.js application
- All API routes and functionality
- Ollama installation scripts
- Static assets and resources

## Next Steps

1. **Icons**: Add proper app icons (currently using default)
2. **Code Signing**: Set up certificates for distribution
3. **Auto-Updater**: Implement automatic updates
4. **System Tray**: Add background operation support
5. **Ollama Integration**: Bundle Ollama binary for zero-setup installation

## Notes

- The desktop app runs the same codebase as the web version
- All existing features work identically
- API routes are handled by the bundled Next.js server
- No changes needed to existing components or logic