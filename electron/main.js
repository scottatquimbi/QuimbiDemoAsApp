const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let nextServerProcess;
let ollamaProcess;
let serverPort = 3000;

function startNextServer() {
  return new Promise(async (resolve, reject) => {
    if (isDev) {
      // Development mode - use npm as before
      console.log('Starting Next.js server in development mode...');
      nextServerProcess = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      });

      let serverStarted = false;
      
      nextServerProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('[Next.js]', output);
        
        // Check if server is ready
        if (output.includes('Ready in') || output.includes('started server on') || output.includes('Local:')) {
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
      
    } else {
      // Production mode - use original standalone server with proper static files
      try {
        const startServer = require('./server');
        const server = await startServer(serverPort);
        
        // Store reference for cleanup and update port if changed
        nextServerProcess = server;
        if (server.port) {
          serverPort = server.port;
        }
        
        console.log(`Production Next.js server started on port ${serverPort}`);
        resolve();
      } catch (error) {
        console.error('Failed to start production server:', error);
        reject(error);
      }
    }
  });
}

function stopNextServer() {
  if (nextServerProcess) {
    console.log('Stopping Next.js server...');
    if (typeof nextServerProcess.kill === 'function') {
      // It's a child process
      nextServerProcess.kill('SIGTERM');
    } else if (typeof nextServerProcess.close === 'function') {
      // It's an HTTP server
      nextServerProcess.close();
    }
    nextServerProcess = null;
  }
}

// Check if Ollama is running
function checkOllamaRunning() {
  return new Promise((resolve) => {
    exec('curl -s --max-time 10 http://localhost:11434/api/tags', { timeout: 15000 }, (error, stdout) => {
      if (error) {
        console.log('🦙 Ollama check failed:', error.message);
        resolve(false);
      } else {
        try {
          JSON.parse(stdout);
          console.log('🦙 Ollama health check successful');
          resolve(true);
        } catch (e) {
          console.log('🦙 Ollama response invalid JSON:', stdout);
          resolve(false);
        }
      }
    });
  });
}

// Start Ollama service as subprocess
function startOllamaService() {
  return new Promise((resolve) => {
    console.log('🦙 Starting Ollama service...');
    
    // Try different possible paths for ollama
    const ollamaPaths = [
      'ollama',
      '/usr/local/bin/ollama',
      '/opt/homebrew/bin/ollama',
      process.env.HOME + '/.ollama/bin/ollama'
    ];
    
    let ollamaPath = 'ollama';
    
    // In production, try to find ollama in common locations
    if (!isDev) {
      for (const path of ollamaPaths) {
        try {
          const { execSync } = require('child_process');
          execSync(`which ${path}`, { stdio: 'ignore' });
          ollamaPath = path;
          console.log(`🦙 Found Ollama at: ${path}`);
          break;
        } catch (error) {
          // Continue to next path
        }
      }
    }
    
    try {
      ollamaProcess = spawn(ollamaPath, ['serve'], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PATH: process.env.PATH + ':/usr/local/bin:/opt/homebrew/bin' }
      });
      
      // Log stderr for debugging
      if (ollamaProcess.stderr) {
        ollamaProcess.stderr.on('data', (data) => {
          console.log('🦙 Ollama stderr:', data.toString());
        });
      }
      
      if (ollamaProcess.pid) {
        console.log(`🦙 Ollama service started with PID: ${ollamaProcess.pid}`);
        ollamaProcess.unref();
        
        // Wait for service to be ready with longer timeout
        let attempts = 0;
        const maxAttempts = 15; // Increased attempts
        
        const checkService = async () => {
          attempts++;
          const isRunning = await checkOllamaRunning();
          
          if (isRunning) {
            console.log('🦙 Ollama service is ready');
            resolve(true);
          } else if (attempts < maxAttempts) {
            console.log(`🦙 Waiting for Ollama service... (attempt ${attempts}/${maxAttempts})`);
            setTimeout(checkService, 3000); // Increased interval
          } else {
            console.log('🦙 Ollama service startup timeout, but continuing...');
            resolve(false);
          }
        };
        
        setTimeout(checkService, 5000); // Longer initial delay
      } else {
        console.log('🦙 Failed to start Ollama service, but continuing...');
        resolve(false);
      }
    } catch (error) {
      console.log('🦙 Error starting Ollama service:', error.message);
      resolve(false);
    }
  });
}

// Stop Ollama service
function stopOllamaService() {
  if (ollamaProcess && ollamaProcess.pid) {
    console.log('🦙 Stopping Ollama service...');
    try {
      process.kill(ollamaProcess.pid, 'SIGTERM');
      ollamaProcess = null;
      console.log('🦙 Ollama service stopped');
    } catch (error) {
      console.log('🦙 Error stopping Ollama service:', error.message);
    }
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
    } else {
      // Force DevTools open for debugging
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
    // Check if Ollama is already running, if not start it
    console.log('🦙 Checking Ollama service status...');
    const isOllamaRunning = await checkOllamaRunning();
    
    if (!isOllamaRunning) {
      console.log('🦙 Ollama not running, starting service...');
      await startOllamaService();
    } else {
      console.log('🦙 Ollama service already running');
    }
    
    await startNextServer();
    createWindow();
    createMenu();
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', `Failed to start the application: ${error.message}`);
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
  stopOllamaService();
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