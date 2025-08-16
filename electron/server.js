const path = require('path');

module.exports = function startNextServer(port = 3000) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Starting Next.js server in-process (no spawn)...');
      
      const { app: electronApp } = require('electron');
      const appPath = electronApp.getAppPath();
      
      // Kill anything running on the target port first
      try {
        const { execSync } = require('child_process');
        console.log(`Attempting to clear port ${port}...`);
        execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
        console.log(`Cleared port ${port}`);
        
        // Wait a moment for the port to be freed
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.log(`Port ${port} was already free or could not be cleared`);
      }
      
      const availablePort = port;
      console.log(`Using port: ${availablePort}`);
      
      // Set environment variables
      process.env.NODE_ENV = 'production';
      process.env.PORT = availablePort.toString();
      process.env.HOSTNAME = '127.0.0.1';
      
      // Try to require and run the standalone server directly
      // Use extraResources path which is outside the asar archive
      const isPacked = electronApp.isPackaged;
      
      let resourcesPath, standaloneServer;
      
      if (isPacked) {
        // In packaged app, use process.resourcesPath for extraResources
        resourcesPath = process.resourcesPath;
        standaloneServer = path.join(resourcesPath, '.next', 'standalone', 'server.js');
      } else {
        // In development, use relative path
        resourcesPath = path.dirname(appPath);
        standaloneServer = path.join(resourcesPath, '.next', 'standalone', 'server.js');
      }
      
      console.log(`App path: ${appPath}`);
      console.log(`Resources path: ${resourcesPath}`);
      console.log(`Looking for standalone server at: ${standaloneServer}`);
      
      // Set up environment variables for static file serving  
      // Next.js standalone expects static files to be relative to the working directory
      const staticDir = path.join(resourcesPath, 'static');
      const publicDir = path.join(resourcesPath, 'public');
      
      console.log(`Static files should be at: ${staticDir}`);
      console.log(`Public files should be at: ${publicDir}`);
      
      if (require('fs').existsSync(standaloneServer)) {
        console.log('Starting Next.js standalone server...');
        
        // Change working directory to the standalone directory  
        const originalCwd = process.cwd();
        const standaloneDir = path.dirname(standaloneServer);
        
        console.log(`Changing working directory to: ${standaloneDir}`);
        process.chdir(standaloneDir);
        
        try {
          // Just require the standalone server - it will start automatically
          require(standaloneServer);
          
          console.log(`Next.js standalone server started on port ${availablePort}`);
          
          resolve({
            close: () => {
              console.log('Next.js server stopped');
            },
            port: availablePort
          });
          
        } catch (serverError) {
          console.error('Standalone server error:', serverError);
          process.chdir(originalCwd);
          throw serverError;
        }
        
      } else {
        throw new Error(`Standalone server not found at: ${standaloneServer}`);
      }
      
    } catch (error) {
      console.error('Server startup error:', error);
      reject(error);
    }
  });
};