const fs = require('fs');
const path = require('path');

// Copy 404.html for SPA routing
const outDir = path.join(__dirname, '../out');
const indexPath = path.join(outDir, 'index.html');
const notFoundPath = path.join(outDir, '404.html');

if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('Created 404.html for SPA routing');
}