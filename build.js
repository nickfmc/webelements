const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const args = require('minimist')(process.argv.slice(2));

// Configuration
const config = {
  src: 'src',
  dist: 'dist',
  components: {
    'button': ['button.css'],
    'card': ['card.css'],
    'hero': ['hero.css'],
    'testimonial': ['testimonial.css'],
    'form': ['form.css'],
    'glassmorphic': ['glassmorphic.css']
  },
  // Order of CSS imports (lower numbers are imported first)
  cssOrder: {
    'glassmorphic.css': 1,
    'button.css': 2,
    'card.css': 3,
    'testimonial.css': 4,
    'form.css': 5,
    'hero.css': 6
  }
};

// Ensure dist directory exists
fs.ensureDirSync(config.dist);

// Copy and combine CSS files
async function build() {
  console.log('Building project...');
  
  // Ensure dist directory is clean
  await fs.emptyDir(config.dist);
  
  // Copy and update HTML file
  let html = await fs.readFile('index.html', 'utf8');
  
  // Create styles directory in dist
  const stylesDir = path.join(config.dist, 'styles');
  await fs.ensureDir(stylesDir);
  
  // Copy all CSS files from src/components to dist/styles
  for (const [component, files] of Object.entries(config.components)) {
    for (const file of files) {
      const sourcePath = path.join(config.src, 'components', component, file);
      const destPath = path.join(stylesDir, file);
      
      if (await fs.pathExists(sourcePath)) {
        await fs.copyFile(sourcePath, destPath);
        console.log(`Copied ${file} to dist/styles/`);
      }
    }
  }
  
  // Create combined CSS file
  let combinedCss = '/* Combined CSS for all components */\n\n';
  
  // Process each component in order
  const sortedComponents = Object.entries(config.components).sort(([a], [b]) => {
    const fileA = a + '.css';
    const fileB = b + '.css';
    return (config.cssOrder[fileA] || 999) - (config.cssOrder[fileB] || 999);
  });
  
  for (const [component, files] of sortedComponents) {
    const componentDir = path.join(config.src, 'components', component);
    await fs.ensureDir(componentDir);
    
    for (const file of files) {
      const sourcePath = path.join(componentDir, file);
      const destPath = path.join(stylesDir, file);
      
      if (await fs.pathExists(sourcePath)) {
        // Copy individual CSS file to dist/styles
        await fs.copy(sourcePath, destPath, { overwrite: true });
        console.log(`Copied ${component}/${file} to dist/styles/`);
        
        // Add to combined CSS
        if (file.endsWith('.css')) {
          const content = await fs.readFile(sourcePath, 'utf8');
          combinedCss += `/* ${component}/${file} */\n${content}\n\n`;
        }
      }
    }
    
    // Create component's index.js
    const indexPath = path.join(componentDir, 'index.js');
    const importStatements = files
      .filter(f => f.endsWith('.css'))
      .map(f => `import './${f}';`)
      .join('\n');
    
    await fs.writeFile(indexPath, `// ${component} component\n${importStatements}\n`);
  }
  
  // Update HTML to reference files in dist/styles instead of src/components
  html = html.replace(/href=["']src\/components\/([^"']+)["']/g, 'href="styles/$1"');
  
  // Write combined CSS file
  const combinedCssPath = path.join(stylesDir, 'all.css');
  await fs.writeFile(combinedCssPath, combinedCss);
  console.log(`Created combined CSS file: ${combinedCssPath}`);
  
  // Update HTML to use combined CSS
  html = html.replace(/<link[^>]*href=['"]([^'"]*\.css)['"][^>]*>/g, '');
  const newCssLink = '    <link rel="stylesheet" href="styles/all.css">';
  const headCloseTag = html.indexOf('</head>');
  if (headCloseTag !== -1) {
    html = html.slice(0, headCloseTag) + newCssLink + '\n    ' + html.slice(headCloseTag);
  }
  
  // Write updated HTML to dist
  await fs.writeFile(path.join(config.dist, 'index.html'), html);
  
  console.log('Build complete!');
}

// Watch for changes in development
if (args.watch) {
  console.log('Watching for changes...');
  const watcher = chokidar.watch(['./src/**/*', 'index.html'], {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  });
  
  watcher
    .on('change', path => {
      console.log(`File ${path} has been changed`);
      build();
    })
    .on('error', error => console.error(`Watcher error: ${error}`));
}

// Run build
build().catch(console.error);
