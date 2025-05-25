const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build Next.js app
console.log('Building Next.js app...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error}`);
    return;
  }
  
  console.log(stdout);
  
  // Create out directory if it doesn't exist
  const outDir = path.join(__dirname, '..', 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }
  
  // Copy static files from .next/static to out/_next/static
  const staticDir = path.join(__dirname, '..', '.next', 'static');
  const outStaticDir = path.join(outDir, '_next', 'static');
  
  if (fs.existsSync(staticDir)) {
    fs.cpSync(staticDir, outStaticDir, { recursive: true });
  }
  
  // Copy public files
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, outDir, { recursive: true });
  }
  
  // Create a basic index.html that redirects to the app
  const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Research News</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
    // Redirect to the actual Next.js app
    window.location.href = 'https://research-news-app--ronshin-72b20.us-central1.hosted.app';
  </script>
</head>
<body>
  <p>Redirecting to Research News...</p>
</body>
</html>`;
  
  fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);
  
  console.log('Static build complete!');
});