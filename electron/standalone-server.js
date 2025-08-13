const path = require('path');
const express = require('express');

module.exports = function startStandaloneServer(port = 3000) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting custom standalone server...');
      
      const { app: electronApp } = require('electron');
      const appPath = electronApp.getAppPath();
      const resourcesPath = path.dirname(appPath);
      
      // Find available port
      const findPort = async (startPort) => {
        return new Promise((resolve) => {
          const { createServer } = require('http');
          const server = createServer();
          server.listen(startPort, '127.0.0.1', () => {
            const actualPort = server.address().port;
            server.close(() => resolve(actualPort));
          }).on('error', () => {
            resolve(findPort(startPort + 1));
          });
        });
      };
      
      const availablePort = await findPort(port);
      console.log(`Using port: ${availablePort}`);
      
      // Create Express app
      const app = express();
      
      // Serve static files first (before Next.js handler)
      const staticPath = path.join(resourcesPath, '.next', 'standalone', '.next', 'static');
      const publicPath = path.join(resourcesPath, 'public');
      
      console.log(`Serving /_next/static from: ${staticPath}`);
      console.log(`Serving public from: ${publicPath}`);
      
      // Serve Next.js static assets
      app.use('/_next/static', express.static(staticPath, {
        maxAge: '1y',
        immutable: true
      }));
      
      // Serve public assets
      app.use(express.static(publicPath, {
        maxAge: '1h'
      }));
      
      // Set up Next.js standalone server
      const standaloneDir = path.join(resourcesPath, '.next', 'standalone');
      const standaloneServerPath = path.join(standaloneDir, 'server.js');
      
      console.log(`Loading Next.js app from: ${standaloneDir}`);
      
      // Change working directory for Next.js
      const originalCwd = process.cwd();
      process.chdir(standaloneDir);
      
      try {
        // Set environment variables for Next.js
        process.env.NODE_ENV = 'production';
        process.env.PORT = availablePort.toString();
        process.env.HOSTNAME = '127.0.0.1';
        
        // Import Next.js and create handler
        const { parse } = require('url');
        
        // Import the standalone Next.js app
        delete require.cache[standaloneServerPath];
        
        // Create a modified version that doesn't auto-start the server
        const originalLog = console.log;
        let nextHandler = null;
        
        // Intercept the Next.js app creation
        const originalStartServer = require('next/dist/server/lib/start-server').startServer;
        require('next/dist/server/lib/start-server').startServer = async (options) => {
          const { createServer } = require('next');
          const app = createServer({
            dev: false,
            dir: standaloneDir,
            conf: options.config
          });
          
          await app.prepare();
          nextHandler = app.getRequestHandler();
          return { server: null }; // Don't start HTTP server
        };
        
        // Load the standalone server (this will set up Next.js but not start HTTP server)
        require(standaloneServerPath);
        
        // Wait a bit for Next.js to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!nextHandler) {
          throw new Error('Failed to initialize Next.js handler');
        }
        
        // Route all other requests to Next.js
        app.all('*', (req, res) => {
          const parsedUrl = parse(req.url, true);
          return nextHandler(req, res, parsedUrl);
        });
        
        // Start the Express server
        const server = app.listen(availablePort, '127.0.0.1', () => {
          console.log(`Custom standalone server ready on http://127.0.0.1:${availablePort}`);
          resolve({
            close: () => {
              console.log('Custom standalone server stopped');
              server.close();
            },
            port: availablePort
          });
        });
        
      } finally {
        // Restore working directory
        process.chdir(originalCwd);
      }
      
    } catch (error) {
      console.error('Custom standalone server startup error:', error);
      reject(error);
    }
  });
};