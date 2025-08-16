const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Dialog methods
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Navigation listeners
  onNavigateTo: (callback) => ipcRenderer.on('navigate-to', callback),
  onNewChat: (callback) => ipcRenderer.on('new-chat', callback),
  onCheckOllamaStatus: (callback) => ipcRenderer.on('check-ollama-status', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Platform info
  platform: process.platform,
  isElectron: true
});

// DOM ready
window.addEventListener('DOMContentLoaded', () => {
  // Handle keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Cmd/Ctrl + N for new chat
    if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
      event.preventDefault();
      // This will be handled by the main process menu
    }
  });
});

// Handle uncaught errors
window.addEventListener('error', (error) => {
  console.error('Electron renderer error:', error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Electron renderer unhandled rejection:', event.reason);
});