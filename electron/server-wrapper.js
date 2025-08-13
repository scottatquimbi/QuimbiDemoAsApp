const path = require('path');
const express = require('express');

module.exports = function startNextServer(port = 3000) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting Next.js server wrapper with static file serving...');
      
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
      
      // Set environment variables
      process.env.NODE_ENV = 'production';
      process.env.PORT = availablePort.toString();
      process.env.HOSTNAME = '127.0.0.1';
      
      // Create Express app for static file serving
      const app = express();
      
      // Serve static files
      const staticPath = path.join(resourcesPath, '.next', 'static');
      const publicPath = path.join(resourcesPath, 'public');
      
      console.log(`Serving static files from: ${staticPath}`);
      console.log(`Serving public files from: ${publicPath}`);
      
      // Static file middleware
      app.use('/_next/static', express.static(staticPath));
      app.use(express.static(publicPath));
      
      // Start the standalone Next.js server in the same process
      const standaloneServer = path.join(resourcesPath, '.next', 'standalone', 'server.js');
      const standaloneDir = path.dirname(standaloneServer);
      
      if (require('fs').existsSync(standaloneServer)) {
        console.log('Loading standalone server...');
        
        // Change working directory to the unpacked standalone directory
        const originalCwd = process.cwd();
        process.chdir(standaloneDir);
        
        try {
          // Import and start Next.js server
          const nextHandler = require(standaloneServer);
          
          // Proxy all non-static requests to Next.js
          app.use('*', (req, res) => {
            return nextHandler(req, res);
          });
          
          // Start the Express server
          const server = app.listen(availablePort, '127.0.0.1', () => {
            console.log(`Next.js server with static files ready on http://127.0.0.1:${availablePort}`);
            resolve({
              close: () => {
                console.log('Next.js server stopped');
                server.close();
              },
              port: availablePort
            });
          });
          
        } finally {
          // Always restore the original working directory
          process.chdir(originalCwd);
        }
        
      } else {
        throw new Error(`Standalone server not found at: ${standaloneServer}`);
      }
      
    } catch (error) {
      console.error('Server wrapper startup error:', error);
      reject(error);
    }
  });
};