const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let nextServerProcess;
let serverPort = 3000;

function startNextServer() {
  return new Promise((resolve, reject) => {
    const serverScript = isDev ? 'dev' : 'start';
    const serverPath = isDev ? process.cwd() : path.join(__dirname, '..');
    
    console.log(`Starting Next.js server in ${isDev ? 'development' : 'production'} mode...`);
    
    nextServerProcess = spawn('npm', ['run', serverScript], {
      cwd: serverPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let serverStarted = false;
    
    nextServerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Next.js]', output);
      
      // Check if server is ready
      if (output.includes('Ready in') || output.includes('started server on')) {
        if (!serverStarted) {
          serverStarted = true;
          resolve();
        }
      }
      
      // Extract port if different from default
      const portMatch = output.match(/localhost:(\d+)/);
      if (portMatch) {
        serverPort = parseInt(portMatch[1]);
      }
    });

    nextServerProcess.stderr.on('data', (data) => {
      console.error('[Next.js Error]', data.toString());
    });

    nextServerProcess.on('close', (code) => {
      console.log(`Next.js server process exited with code ${code}`);
      if (!serverStarted) {
        reject(new Error(`Next.js server failed to start (exit code: ${code})`));
      }
    });

    nextServerProcess.on('error', (error) => {
      console.error('Failed to start Next.js server:', error);
      if (!serverStarted) {
        reject(error);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Next.js server startup timeout'));
      }
    }, 30000);
  });
}

function stopNextServer() {
  if (nextServerProcess) {
    console.log('Stopping Next.js server...');
    nextServerProcess.kill('SIGTERM');
    nextServerProcess = null;
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Load the app
  const startUrl = `http://localhost:${serverPort}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== startUrl && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Chat',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('new-chat');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Support',
      submenu: [
        {
          label: 'Demo Scenarios',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', '/demo');
            }
          }
        },
        {
          label: 'Automated Support',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', '/automated-support');
            }
          }
        },
        {
          label: 'Admin Panel',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('navigate-to', '/admin');
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Quimbi Support Assistant',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'Quimbi Support Assistant',
              detail: 'AI-powered customer support system for Game of Thrones mobile strategy game.\n\nVersion: 1.0.0\nPowered by Ollama AI'
            });
          }
        },
        {
          label: 'Check Ollama Status',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('check-ollama-status');
            }
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();
    createMenu();
  } catch (error) {
    console.error('Failed to start Next.js server:', error);
    dialog.showErrorBox('Startup Error', `Failed to start the application server: ${error.message}`);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Clean up any resources here
  stopNextServer();
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Auto-updater (for future implementation)
if (!isDev) {
  // TODO: Implement auto-updater
  // const { autoUpdater } = require('electron-updater');
  // autoUpdater.checkForUpdatesAndNotify();
}