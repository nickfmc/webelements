const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Simple argument parsing
const args = {};
process.argv.slice(2).forEach(arg => {
  const [key, value] = arg.split('=');
  args[key.replace(/^-+/, '')] = value || true;
});

// Configuration
const config = {
  src: 'src',
  dist: 'dist',
  includes: 'src/includes',
  components: {
    'glass': ['glass-base.css', 'glass.css'],       // Core glassmorphic system
    'glass-fx': ['glass-fx.css', 'glass-fx.js', 'tilt-fx.js', 'spotlight-fx.js'], // Glass effects
    'header': ['header.css'],     // Header styles
    'button': ['button.css'],
    'card': ['card.css'],
    'testimonial': ['testimonial.css'],
    'form': ['form.css'],
    'hero': ['hero.css', 'hero-styles.css'],
    'pricing': ['pricing.css'],
    'features': ['features.css'],
    'team': ['team.css'],
    'cta': ['cta.css'],
    'accordion': ['accordion.css']
  },
  // Order of CSS imports (lower numbers are imported first)
  cssOrder: {
    'glass-base.css': 0,    // Base variables and styles, must be first
    'glass.css': 1,         // Core glassmorphic system must be first
    'glass-fx.css': 1.5,    // Glass effects styles
    'header.css': 2,      // Header styles early for proper layering
    'button.css': 3,
    'card.css': 4,
    'testimonial.css': 5,
    'form.css': 6,
    'pricing.css': 7,
    'features.css': 8,
    'team.css': 9,
    'cta.css': 10,
    'hero.css': 11,
    'accordion.css': 12
  }
};

// Ensure dist directory exists
fs.ensureDirSync(config.dist);

// Process includes in HTML content
async function processIncludes(content, baseDir = '') {
  const includeRegex = /<!--\s*#include\s+file=["']([^"']+)["']\s*-->/g;
  let match;
  let result = content;
  
  while ((match = includeRegex.exec(content)) !== null) {
    const includePath = path.join(baseDir, match[1]);
    try {
      let includeContent = await fs.readFile(includePath, 'utf8');
      // Recursively process includes in the included file
      includeContent = await processIncludes(includeContent, path.dirname(includePath));
      result = result.replace(match[0], includeContent);
    } catch (err) {
      console.error(`Error including file: ${includePath}`, err);
    }
  }
  
  return result;
}

// Copy and combine CSS/JS files
async function build() {
  console.log('Building project...');
  
  // Ensure dist directory is clean
  await fs.emptyDir(config.dist);

  // Create asset directories in dist
  const stylesDir = path.join(config.dist, 'styles');
  const jsDir = path.join(config.dist, 'js');
  await fs.ensureDir(stylesDir);
  await fs.ensureDir(jsDir);

  // --- Process HTML Files ---
  const pages = ['index.html', 'showcase.html'];
  for (const page of pages) {
    if (await fs.pathExists(page)) {
      const htmlContent = await fs.readFile(page, 'utf8');
      const processedHtml = await processIncludes(htmlContent);
      await fs.writeFile(path.join(config.dist, page), processedHtml);
      console.log(`Processed ${page}`);
    }
  }
  
    // Copy all component CSS files to dist/styles
  for (const [component, files] of Object.entries(config.components)) {
    const componentDir = path.join(config.src, 'components', component);
    
    // Check if component directory exists
    if (!(await fs.pathExists(componentDir))) {
      console.warn(`Component directory not found: ${componentDir}`);
      continue;
    }
    
    // Process each CSS file for this component
    for (const file of files) {
      const sourcePath = path.join(componentDir, file);
      const destPath = path.join(stylesDir, file);
      
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath);
        console.log(`Copied ${component}/${file} to dist/styles/`);
      } else {
        console.warn(`CSS file not found: ${sourcePath}`);
      }
    }
  }
  
  // Combine CSS files in the correct order
  let combinedCss = '/* Combined CSS for all components */\n\n';
  
  // First, collect all CSS files with their order
  const cssFiles = [];
  for (const [component, files] of Object.entries(config.components)) {
    for (const file of files) {
      const sourcePath = path.join(config.src, 'components', component, file);
      if (await fs.pathExists(sourcePath)) {
        const order = config.cssOrder[file] || 999;
        cssFiles.push({
          path: sourcePath,
          component,
          file,
          order
        });
      }
    }
  }
  
  // Sort CSS files by their defined order
  cssFiles.sort((a, b) => a.order - b.order);
  
  // Add component styles to combined CSS
  for (const { path: sourcePath, component, file } of cssFiles) {
    const content = await fs.readFile(sourcePath, 'utf8');
    combinedCss += `/* ${component}/${file} */\n${content}\n\n`;
  }
  
  // Write combined CSS file
  await fs.writeFile(path.join(stylesDir, 'all.css'), combinedCss);
  console.log('Created combined CSS file: dist/styles/all.css');
  
  // --- Process JavaScript Files ---
  const accordionJsSrc = 'src/components/accordion/accordion.js';
  if (await fs.pathExists(accordionJsSrc)) {
    await fs.copy(accordionJsSrc, path.join(jsDir, 'accordion.js'));
    console.log('Copied accordion.js to dist/js/');
  }

  // --- Finalize HTML Files ---
  for (const page of pages) {
    if (await fs.pathExists(path.join(config.dist, page))) {
      let html = await fs.readFile(path.join(config.dist, page), 'utf8');
      // Replace CSS links
      html = html.replace(/<link rel="stylesheet" href="dist\/styles\/all.css">/g, '<link rel="stylesheet" href="styles/all.css">');
      // Replace JS links
      html = html.replace(/<script src="src\/components\/accordion\/accordion.js"><\/script>/g, '<script src="js/accordion.js"></script>');
      await fs.writeFile(path.join(config.dist, page), html);
      console.log(`Finalized links in ${page}`);
    }
  }
  
  // Copy assets
  if (await fs.pathExists(path.join(config.src, 'assets'))) {
    await fs.copy(path.join(config.src, 'assets'), path.join(config.dist, 'assets'));
    console.log('Copied assets to dist/assets/');
  }
  
  console.log('Build complete!');
}

// Simple watch mode implementation
if (args.watch) {
  console.log('Watch mode not implemented. Please restart the build after changes.');
  // In a real implementation, you might want to use chokidar or similar
  // For now, we'll just run the build once
}

// Run build
build().catch(console.error);
