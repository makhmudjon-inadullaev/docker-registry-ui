/*
 * Copyright (C) 2016-2023 Jones Magloire @Joxit
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration from environment variables
const PORT = process.env.PORT || 80;
const REGISTRY_URL = process.env.NGINX_PROXY_PASS_URL || process.env.REGISTRY_URL || '';
const REGISTRY_DATA_PATH = process.env.REGISTRY_DATA_PATH || '/var/lib/registry';
const REGISTRY_READMES_PATH = process.env.REGISTRY_READMES_PATH || 'docker/registry/v2/repositories';
const STATIC_DIR = path.resolve(process.env.STATIC_DIR || path.join(__dirname, '../dist'));

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

/**
 * Get the full path to the README file for an image
 * @param {string} imageName - Image name (can contain slashes for nested repos)
 * @returns {string|null} - Full path to README.md file or null if path is invalid
 */
function getReadmePath(imageName) {
  // Resolve the path to prevent directory traversal
  const basePath = path.resolve(REGISTRY_DATA_PATH, REGISTRY_READMES_PATH);
  const fullPath = path.resolve(basePath, imageName, 'README.md');
  
  // Verify the resolved path is within the expected directory
  const relativePath = path.relative(basePath, fullPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null; // Path traversal attempt detected
  }
  
  return fullPath;
}

/**
 * Ensure directory exists for a file path
 * @param {string} filePath - Path to the file
 */
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Handle README GET request
 * @param {string} imageName - Image name from URL
 * @param {http.ServerResponse} res - Response object
 */
function handleReadmeGet(imageName, res) {
  const readmePath = getReadmePath(imageName);
  
  if (!readmePath) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(400);
    res.end('Invalid image name');
    return;
  }
  
  fs.readFile(readmePath, 'utf8', (err, data) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (err) {
      if (err.code === 'ENOENT') {
        // File doesn't exist - return empty string
        res.writeHead(200);
        res.end('');
      } else {
        console.error(`Error reading README for ${imageName}:`, err);
        res.writeHead(500);
        res.end('Error reading README file');
      }
    } else {
      res.writeHead(200);
      res.end(data);
    }
  });
}

/**
 * Handle README POST request (save/update)
 * @param {string} imageName - Image name from URL
 * @param {http.IncomingMessage} req - Request object
 * @param {http.ServerResponse} res - Response object
 */
function handleReadmePost(imageName, req, res) {
  const readmePath = getReadmePath(imageName);
  
  if (!readmePath) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(400);
    res.end(JSON.stringify({ success: false, message: 'Invalid image name' }));
    return;
  }
  
  let body = '';
  
  req.on('data', (chunk) => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const content = body || '';
      if (content.trim()) {
        ensureDirectoryExists(readmePath);
        fs.writeFileSync(readmePath, body, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'README saved successfully' }));
      } else {
        // Empty content - delete the file if it exists
        if (fs.existsSync(readmePath)) {
          fs.unlinkSync(readmePath);
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'README deleted successfully' }));
      }
    } catch (err) {
      console.error(`Error saving README for ${imageName}:`, err);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, message: 'Error saving README file' }));
    }
  });
}

/**
 * Handle README DELETE request
 * @param {string} imageName - Image name from URL
 * @param {http.ServerResponse} res - Response object
 */
function handleReadmeDelete(imageName, res) {
  const readmePath = getReadmePath(imageName);
  
  if (!readmePath) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(400);
    res.end(JSON.stringify({ success: false, message: 'Invalid image name' }));
    return;
  }
  
  try {
    if (fs.existsSync(readmePath)) {
      fs.unlinkSync(readmePath);
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, message: 'README deleted successfully' }));
  } catch (err) {
    console.error(`Error deleting README for ${imageName}:`, err);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, message: 'Error deleting README file' }));
  }
}

/**
 * Proxy request to Docker Registry
 * @param {http.IncomingMessage} req - Request object
 * @param {http.ServerResponse} res - Response object
 */
function proxyToRegistry(req, res) {
  if (!REGISTRY_URL) {
    res.writeHead(502);
    res.end('Registry URL not configured');
    return;
  }

  const targetUrl = new URL(req.url, REGISTRY_URL);
  
  // Create a copy of headers and set host
  const headers = { ...req.headers };
  headers['host'] = targetUrl.host;
  
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: headers,
  };

  const protocol = targetUrl.protocol === 'https:' ? https : http;
  
  const proxyReq = protocol.request(options, (proxyRes) => {
    // Copy response headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  // Forward request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
}

/**
 * Serve static files
 * @param {string} filePath - Path to the file
 * @param {http.ServerResponse} res - Response object
 */
function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // For SPA routing, serve index.html for non-existent paths
        const indexPath = path.join(STATIC_DIR, 'index.html');
        fs.readFile(indexPath, (indexErr, indexData) => {
          if (indexErr) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(indexData);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    } else {
      res.setHeader('Content-Type', contentType);
      res.writeHead(200);
      res.end(data);
    }
  });
}

/**
 * Main request handler
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.writeHead(204);
    res.end();
    return;
  }

  // README API endpoints: /api/readme/{imageName}
  const readmeMatch = pathname.match(/^\/api\/readme\/(.+)$/);
  if (readmeMatch) {
    const imageName = decodeURIComponent(readmeMatch[1]);
    
    if (req.method === 'GET') {
      handleReadmeGet(imageName, res);
    } else if (req.method === 'POST') {
      handleReadmePost(imageName, req, res);
    } else if (req.method === 'DELETE') {
      handleReadmeDelete(imageName, res);
    } else {
      res.writeHead(405);
      res.end('Method Not Allowed');
    }
    return;
  }

  // Proxy /v2/* requests to Docker Registry
  if (pathname.startsWith('/v2')) {
    proxyToRegistry(req, res);
    return;
  }

  // Serve static files
  let filePath = path.resolve(path.join(STATIC_DIR, pathname));
  
  // If path ends with /, serve index.html
  if (pathname.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }

  // Security: prevent directory traversal using path.relative
  const relativePath = path.relative(STATIC_DIR, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check if path is a directory
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    serveStaticFile(filePath, res);
  });
});

server.listen(PORT, () => {
  console.log(`Docker Registry UI server running on port ${PORT}`);
  console.log(`Registry URL: ${REGISTRY_URL || 'Not configured'}`);
  console.log(`Registry data path: ${REGISTRY_DATA_PATH}`);
  console.log(`README files path: ${path.join(REGISTRY_DATA_PATH, REGISTRY_READMES_PATH)}`);
  console.log(`Static files directory: ${STATIC_DIR}`);
});
