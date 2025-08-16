const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up sharp dependencies before electron pack...');

// Remove problematic sharp directories
const sharpPaths = [
  'node_modules/@img',
  'node_modules/next/node_modules/@img',
  '.next/standalone/node_modules/@img',
  '.next/standalone/node_modules/next/node_modules/@img'
];

sharpPaths.forEach(sharpPath => {
  const fullPath = path.join(__dirname, '..', sharpPath);
  if (fs.existsSync(fullPath)) {
    console.log(`  Removing: ${sharpPath}`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log('✅ Sharp cleanup completed');