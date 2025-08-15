# Quimbi macOS Preparation Tool

## Overview

The Quimbi macOS Preparation Tool is a **standalone executable** that prepares any macOS computer to run the Quimbi Support Assistant. It does not affect the main application repository and has one simple job: ensure Ollama is installed with the required `llama3.1:8b` model.

## 🎯 Purpose

- **Detect** if Ollama is installed
- **Install** Ollama if missing (via Homebrew or manual instructions)
- **Download** the `llama3.1:8b` model if not present (~4.7GB)
- **Verify** everything is working correctly
- **Display** "Ready for Quimbi!" when complete

## 📁 Files Created

### Source Files
- `prepare-macos.js` - Main preparation script (Node.js)
- `build-prepare-tool.sh` - Build script to create executables
- `prepare-package.json` - Package configuration for building

### Built Executables (in `dist/` folder)
- `prepare-quimbi-macos` - **Universal launcher** (detects Mac type automatically)
- `prepare-quimbi-macos-arm64` - For Apple Silicon Macs (M1, M2, M3, etc.)
- `prepare-quimbi-macos-x64` - For Intel Macs
- `README.md` - Instructions for end users

## 🚀 Usage for End Users

### Simple Usage
```bash
./prepare-quimbi-macos
```

### With Options
```bash
./prepare-quimbi-macos --verbose    # Show detailed output
./prepare-quimbi-macos --force      # Force reinstall components
./prepare-quimbi-macos --help       # Show help information
```

## 🔨 Building the Executable

To rebuild the standalone executables:

```bash
# Make sure you're in the project root
./build-prepare-tool.sh
```

This creates:
- Universal launcher that auto-detects architecture
- ARM64 executable for Apple Silicon Macs
- x64 executable for Intel Macs
- Complete documentation

## 📋 What the Tool Does

1. **System Detection**
   - Detects macOS version and architecture
   - Shows system information in verbose mode

2. **Ollama Installation Check**
   - Checks if `ollama` command is available
   - Verifies Ollama can run (`ollama --version`)

3. **Ollama Installation (if needed)**
   - **Option A**: Uses Homebrew if available (`brew install ollama`)
   - **Option B**: Provides manual installation instructions with download link
   - **Verification**: Confirms installation worked

4. **Model Check**
   - Lists installed models (`ollama list`)
   - Checks if `llama3.1:8b` is present

5. **Model Download (if needed)**
   - Downloads `llama3.1:8b` model (`ollama pull llama3.1:8b`)
   - Shows download progress (model is ~4.7GB)
   - Handles download errors gracefully

6. **System Verification**
   - Starts Ollama service if not running
   - Tests API connectivity (`curl localhost:11434/api/tags`)
   - Confirms required model is accessible

7. **Success Confirmation**
   - Displays "🎉 Ready for Quimbi!" when complete
   - Lists what was installed/verified

## 📖 Distribution

### For Developers
- Source files are in the main repo directory
- Run `./build-prepare-tool.sh` to create executables
- Distribute the `dist/` folder contents

### For End Users
- Download the `dist/` folder
- Run `./prepare-quimbi-macos`
- No Node.js or dependencies required

## 🛠 Technical Details

- **Language**: Node.js (compiled to standalone executable)
- **Packaging**: Uses `pkg` to create self-contained binaries
- **Dependencies**: None (standalone executables include Node.js runtime)
- **Compatibility**: macOS 10.15+ (both Intel and Apple Silicon)
- **Size**: ~45-50MB per executable (includes Node.js runtime)

## 🔍 Error Handling

The tool handles common scenarios:
- ❌ **No Homebrew**: Provides manual installation instructions
- ❌ **Network issues**: Clear error messages for download failures
- ❌ **Insufficient disk space**: Warns about 8GB+ requirement
- ❌ **Architecture mismatch**: Universal launcher detects and runs correct binary
- ❌ **Ollama service issues**: Attempts to start service automatically

## 🎯 Success Criteria

When the tool completes successfully, the user's Mac will have:
- ✅ Ollama installed and working
- ✅ `llama3.1:8b` model downloaded and available
- ✅ Ollama service running and responsive
- ✅ System ready to run Quimbi Support Assistant.app

The tool will display: **"🎉 Ready for Quimbi!"**

## 🔧 Maintenance

- **Model updates**: Change `REQUIRED_MODEL` constant in `prepare-macos.js`
- **Ollama updates**: Tool will use latest version from Homebrew/website
- **Rebuilding**: Run `./build-prepare-tool.sh` after any changes
- **Testing**: Test with `./prepare-quimbi-macos --help` and `--verbose`

This tool ensures any macOS computer can quickly and easily be prepared to run the Quimbi Support Assistant without affecting the main application or requiring technical knowledge.