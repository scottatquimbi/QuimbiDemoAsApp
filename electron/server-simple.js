const path = require('path');

module.exports = function startNextServer(port = 3000) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting simple static file server...');
      
      const { app: electronApp } = require('electron');
      const appPath = electronApp.getAppPath();
      const resourcesPath = path.dirname(appPath);
      const standaloneDir = path.join(resourcesPath, '.next', 'standalone');
      
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
      
      // Set environment variables
      process.env.NODE_ENV = 'production';
      process.env.PORT = availablePort.toString();
      process.env.HOSTNAME = '127.0.0.1';
      
      // Create simple HTTP server with manual routing
      const http = require('http');
      const fs = require('fs');
      const mime = require('mime-types');
      
      const server = http.createServer((req, res) => {
        console.log(`Request: ${req.method} ${req.url}`);
        
        // Handle static files first
        if (req.url.startsWith('/_next/static/')) {
          // Convert /_next/static/... to ./static/...
          const staticPath = req.url.replace('/_next/static/', 'static/');
          const fullPath = path.join(standaloneDir, staticPath);
          
          console.log(`Static file request: ${req.url} -> ${fullPath}`);
          
          if (fs.existsSync(fullPath)) {
            const contentType = mime.lookup(fullPath) || 'application/octet-stream';
            const content = fs.readFileSync(fullPath);
            
            res.writeHead(200, { 
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable'
            });
            res.end(content);
            return;
          } else {
            console.log(`Static file not found: ${fullPath}`);
          }
        }
        
        // Handle public files
        if (!req.url.startsWith('/api') && !req.url.startsWith('/_next')) {
          const publicPath = path.join(standaloneDir, 'public', req.url === '/' ? 'index.html' : req.url);
          
          if (fs.existsSync(publicPath)) {
            const contentType = mime.lookup(publicPath) || 'application/octet-stream';
            const content = fs.readFileSync(publicPath);
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
            return;
          }
        }
        
        // For all other requests, return a simple response indicating Next.js isn't handling them
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<!DOCTYPE html><html><body><h1>Static File Server Running</h1><p>Request: ' + req.url + '</p></body></html>');
      });
      
      server.listen(availablePort, '127.0.0.1', () => {
        console.log(`Simple static server ready on http://127.0.0.1:${availablePort}`);
        resolve({
          port: availablePort,
          close: () => {
            console.log('Simple server stopped');
            server.close();
          }
        });
      });
      
    } catch (error) {
      console.error('Simple server startup error:', error);
      reject(error);
    }
  });
};