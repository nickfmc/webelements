const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// First, build the project to ensure all files are in place
try {
    console.log('Building project...');
    execSync('node build.js', { stdio: 'inherit' });
    console.log('Build completed successfully!');
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}

const server = http.createServer((req, res) => {
    // Default to index.html if no file is specified
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        return res.end('File not found');
    }

    // Read the file
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            res.statusCode = 500;
            return res.end('Error loading the file');
        }

        // Process includes
        const processedContent = content.replace(
            /<!--#include\s+virtual=["']([^"']+)["']\s*-->/g,
            (match, includePath) => {
                try {
                    const fullPath = path.join(__dirname, includePath);
                    return fs.readFileSync(fullPath, 'utf8');
                } catch (e) {
                    console.error(`Error including file: ${includePath}`, e);
                    return `<!-- Error including: ${includePath} -->`;
                }
            }
        );

        // Set content type based on file extension
        const extname = path.extname(filePath);
        let contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpg';
                break;
        }

        // Send the processed content
        res.setHeader('Content-Type', contentType);
        res.end(processedContent, 'utf-8');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
});
