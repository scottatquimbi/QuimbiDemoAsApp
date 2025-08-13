const path = require('path');

module.exports = function startNextServer(port = 3000) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting Next.js standalone server (fixed implementation)...');
      
      const { app: electronApp } = require('electron');
      const appPath = electronApp.getAppPath();
      const resourcesPath = path.dirname(appPath);
      const standaloneDir = path.join(resourcesPath, '.next', 'standalone');
      
      console.log(`App path: ${appPath}`);
      console.log(`Resources path: ${resourcesPath}`);
      console.log(`Standalone directory: ${standaloneDir}`);
      
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
      
      // Verify the critical file structure exists
      const staticDir = path.join(standaloneDir, 'static');
      const publicDir = path.join(standaloneDir, 'public');
      const serverFile = path.join(standaloneDir, 'server.js');
      
      console.log(`Checking static files at: ${staticDir}`);
      console.log(`Checking public files at: ${publicDir}`);
      console.log(`Checking server file at: ${serverFile}`);
      
      const staticExists = require('fs').existsSync(staticDir);
      const publicExists = require('fs').existsSync(publicDir);
      const serverExists = require('fs').existsSync(serverFile);
      
      console.log(`Static directory exists: ${staticExists}`);
      console.log(`Public directory exists: ${publicExists}`);
      console.log(`Server file exists: ${serverExists}`);
      
      if (!serverExists) {
        throw new Error(`Standalone server not found at: ${serverFile}`);
      }
      
      // Critical: Change working directory to standalone directory
      const originalCwd = process.cwd();
      console.log(`Changing working directory from ${originalCwd} to ${standaloneDir}`);
      process.chdir(standaloneDir);
      
      try {
        // Set environment variables for Next.js standalone
        process.env.NODE_ENV = 'production';
        process.env.PORT = availablePort.toString();
        process.env.HOSTNAME = '127.0.0.1';
        
        console.log('Environment variables set:', {
          NODE_ENV: process.env.NODE_ENV,
          PORT: process.env.PORT,
          HOSTNAME: process.env.HOSTNAME
        });
        
        // Create a custom server wrapper to handle static files properly
        const express = require('express');
        const app = express();
        
        // Serve static files BEFORE Next.js handler
        console.log('Setting up static file serving...');
        app.use('/_next/static', express.static(path.join(standaloneDir, 'static'), {
          maxAge: '1y',
          immutable: true
        }));
        
        app.use(express.static(path.join(standaloneDir, 'public'), {
          maxAge: '1h'
        }));
        
        console.log('Setting up Next.js handler...');
        
        // Import Next.js and create the request handler
        const { parse } = require('url');
        const next = require('next');
        
        const nextApp = next({
          dev: false,
          dir: standaloneDir,
          quiet: true
        });
        
        await nextApp.prepare();
        const handle = nextApp.getRequestHandler();
        
        // Route all other requests to Next.js
        app.all('*', (req, res) => {
          const parsedUrl = parse(req.url, true);
          return handle(req, res, parsedUrl);
        });
        
        // Start the server
        const server = app.listen(availablePort, '127.0.0.1', () => {
          console.log(`Custom Next.js server ready on http://127.0.0.1:${availablePort}`);
        });
        
        // Wait a moment for the server to start
        await new Promise(res => setTimeout(res, 2000));
        
        resolve({
          port: availablePort,
          close: () => {
            console.log('Custom Next.js server stopped');
            server.close();
          }
        });
        
      } finally {
        // Always restore the original working directory for cleanup
        // (but keep the server running in the standalone directory)
      }
      
    } catch (error) {
      console.error('Standalone server startup error:', error);
      reject(error);
    }
  });
};