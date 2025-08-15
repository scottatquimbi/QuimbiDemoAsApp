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
