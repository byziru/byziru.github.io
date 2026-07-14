const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { execSync } = require('child_process');

// ========================================== CONFIGURATION ==========================================
const ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN || process.argv[2];
const WORKSPACE_DIR = __dirname;
const FILES_DIR = path.join(WORKSPACE_DIR, 'Files');
const THUMBNAILS_DIR = path.join(FILES_DIR, '.thumbnails');
const CACHE_FILE = path.join(WORKSPACE_DIR, 'dropbox_sync_cache.json');
const OUTPUT_DATA_FILE = path.join(WORKSPACE_DIR, 'media_data.js');

// Directory mapping to galleries
const CATEGORIES = {
  ugc: { dirName: 'Talent', isVideo: true },
  videos: { dirName: 'Videos', isVideo: true },
  static: { dirName: 'Static Posts', isVideo: false }
};

function generateLocalData() {
  const resultData = { ugc: [], videos: [], static: [] };
  
  for (const [categoryKey, catInfo] of Object.entries(CATEGORIES)) {
    const categoryDir = path.join(FILES_DIR, catInfo.dirName);
    if (!fs.existsSync(categoryDir)) continue;
    
    const files = fs.readdirSync(categoryDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      if (f === 'desktop.ini') return false;
      return ['.mp4', '.mov', '.png', '.jpg', '.jpeg'].includes(ext);
    });
    
    for (const filename of files) {
      const localPath = `Files/${catInfo.dirName}/${filename}`;
      let thumbnailPath = localPath;
      
      if (catInfo.isVideo) {
        const thumbnailName = `${path.basename(filename, path.extname(filename))}_thumb.jpg`;
        const localThumbFilePath = path.join(THUMBNAILS_DIR, thumbnailName);
        if (fs.existsSync(localThumbFilePath)) {
          thumbnailPath = `Files/.thumbnails/${thumbnailName}`;
        }
      }
      
      resultData[categoryKey].push({
        name: filename,
        src: localPath,
        thumbnail: thumbnailPath,
        isVideo: catInfo.isVideo
      });
    }
  }
  
  fs.writeFileSync(OUTPUT_DATA_FILE, `var portfolioData = ${JSON.stringify(resultData, null, 2)};`, 'utf8');
  console.log(`Success! Local offline media_data.js generated at ${OUTPUT_DATA_FILE}`);
}

if (!ACCESS_TOKEN) {
  console.log("No Dropbox Access Token detected.");
  console.log("Generating offline media_data.js with local relative file paths for immediate local testing...");
  generateLocalData();
  process.exit(0);
}

// Ensure thumbnails directory exists
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

// Load cache
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (e) {
    console.warn("Could not parse cache file, starting fresh.");
  }
}

// Helper to calculate file MD5 hash
function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

// Helper to make HTTPS POST requests
function makeRequest(urlStr, options, bodyBuffer) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const reqOptions = {
      method: options.method || 'POST',
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: options.headers || {}
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const text = buffer.toString('utf8');
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(text ? JSON.parse(text) : {});
          } catch (e) {
            resolve(text);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${text}`));
        }
      });
    });
    
    req.on('error', (e) => reject(e));
    
    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

// Chunked and single upload helper
const CHUNK_LIMIT = 100 * 1024 * 1024; // 100MB

async function uploadToDropbox(localPath, dropboxPath) {
  const stat = fs.statSync(localPath);
  const size = stat.size;
  
  if (size <= CHUNK_LIMIT) {
    console.log(`  Uploading ${path.basename(localPath)} (${(size / (1024 * 1024)).toFixed(2)} MB)...`);
    const fileBuffer = fs.readFileSync(localPath);
    return makeRequest('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'overwrite',
          autorename: false,
          mute: true,
          strict_conflict: false
        }),
        'Content-Type': 'application/octet-stream'
      }
    }, fileBuffer);
  } else {
    console.log(`  Uploading ${path.basename(localPath)} in chunks (${(size / (1024 * 1024)).toFixed(2)} MB)...`);
    const fd = fs.openSync(localPath, 'r');
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    const buffer = Buffer.alloc(chunkSize);
    
    console.log(`  Starting session...`);
    let bytesRead = fs.readSync(fd, buffer, 0, chunkSize, 0);
    const startRes = await makeRequest('https://content.dropboxapi.com/2/files/upload_session/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({ close: false }),
        'Content-Type': 'application/octet-stream'
      }
    }, buffer.slice(0, bytesRead));
    
    const sessionId = startRes.session_id;
    let offset = bytesRead;
    
    while (offset < size) {
      bytesRead = fs.readSync(fd, buffer, 0, chunkSize, offset);
      if (bytesRead === 0) break;
      
      console.log(`  Appending chunk at offset ${offset} (${((offset / size) * 100).toFixed(0)}%)...`);
      
      await makeRequest('https://content.dropboxapi.com/2/files/upload_session/append_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Dropbox-API-Arg': JSON.stringify({
            cursor: { session_id: sessionId, offset: offset },
            close: false
          }),
          'Content-Type': 'application/octet-stream'
        }
      }, buffer.slice(0, bytesRead));
      
      offset += bytesRead;
    }
    
    fs.closeSync(fd);
    
    console.log(`  Finishing session and committing to ${dropboxPath}...`);
    return makeRequest('https://content.dropboxapi.com/2/files/upload_session/finish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Dropbox-API-Arg': JSON.stringify({
          cursor: { session_id: sessionId, offset: size },
          commit: {
            path: dropboxPath,
            mode: 'overwrite',
            autorename: false,
            mute: true,
            strict_conflict: false
          }
        }),
        'Content-Type': 'application/octet-stream'
      }
    });
  }
}

// Generate shared link or return existing one
async function getOrCreateSharedLink(dropboxPath) {
  try {
    const res = await makeRequest('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, Buffer.from(JSON.stringify({
      path: dropboxPath,
      settings: { requested_visibility: 'public' }
    })));
    return res.url;
  } catch (err) {
    if (err.message && err.message.includes('shared_link_already_exists')) {
      const listRes = await makeRequest('https://api.dropboxapi.com/2/sharing/list_shared_links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }, Buffer.from(JSON.stringify({
        path: dropboxPath,
        direct_only: true
      })));
      if (listRes.links && listRes.links.length > 0) {
        return listRes.links[0].url;
      }
    }
    throw err;
  }
}

// Transform Dropbox shared link to raw direct content URL
function convertToDirectLink(dropboxUrl) {
  return dropboxUrl.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
}

// Main sync process
async function run() {
  const resultData = { ugc: [], videos: [], static: [] };
  
  for (const [categoryKey, catInfo] of Object.entries(CATEGORIES)) {
    const categoryDir = path.join(FILES_DIR, catInfo.dirName);
    if (!fs.existsSync(categoryDir)) {
      console.warn(`Warning: Directory ${categoryDir} does not exist. Skipping category ${categoryKey}.`);
      continue;
    }
    
    console.log(`Processing category: ${categoryKey} (folder: ${catInfo.dirName})...`);
    
    const files = fs.readdirSync(categoryDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      if (f === 'desktop.ini') return false;
      return ['.mp4', '.mov', '.png', '.jpg', '.jpeg'].includes(ext);
    });
    
    for (const filename of files) {
      const localPath = path.join(categoryDir, filename);
      const hash = await getFileHash(localPath);
      const dropboxPath = `/Portfolio/${categoryKey}/${filename}`;
      
      let directUrl = '';
      let thumbnailUrl = '';
      
      // Step 1: Upload and get link for the main file
      if (cache[dropboxPath] && cache[dropboxPath].hash === hash) {
        console.log(`  File ${filename} is unchanged (cached).`);
        directUrl = cache[dropboxPath].directUrl;
      } else {
        try {
          await uploadToDropbox(localPath, dropboxPath);
          const sharedLink = await getOrCreateSharedLink(dropboxPath);
          directUrl = convertToDirectLink(sharedLink);
          
          cache[dropboxPath] = {
            hash: hash,
            dropboxPath: dropboxPath,
            directUrl: directUrl
          };
        } catch (e) {
          console.error(`  Error uploading ${filename}:`, e.message);
          continue;
        }
      }
      
      // Step 2: Handle video thumbnail generation & upload
      if (catInfo.isVideo) {
        const thumbnailName = `${path.basename(filename, path.extname(filename))}_thumb.jpg`;
        const localThumbPath = path.join(THUMBNAILS_DIR, thumbnailName);
        const dropboxThumbPath = `/Portfolio/${categoryKey}/.thumbnails/${thumbnailName}`;
        
        // Extract frame using ffmpeg
        if (!fs.existsSync(localThumbPath) || !(cache[dropboxThumbPath] && cache[dropboxThumbPath].parentHash === hash)) {
          console.log(`  Generating thumbnail for ${filename}...`);
          try {
            const ffmpegPath = path.join(WORKSPACE_DIR, 'ffmpeg.exe');
            const cmd = fs.existsSync(ffmpegPath) 
              ? `"${ffmpegPath}" -y -ss 00:00:01 -i "${localPath}" -vframes 1 -q:v 2 "${localThumbPath}"`
              : `ffmpeg -y -ss 00:00:01 -i "${localPath}" -vframes 1 -q:v 2 "${localThumbPath}"`;
            
            execSync(cmd, { stdio: 'ignore' });
          } catch (e) {
            console.warn(`  Warning: Failed to generate thumbnail for ${filename}. Using placeholder.`);
          }
        }
        
        // Upload thumbnail if created
        if (fs.existsSync(localThumbPath)) {
          const thumbHash = await getFileHash(localThumbPath);
          if (cache[dropboxThumbPath] && cache[dropboxThumbPath].hash === thumbHash) {
            thumbnailUrl = cache[dropboxThumbPath].directUrl;
          } else {
            try {
              await uploadToDropbox(localThumbPath, dropboxThumbPath);
              const thumbSharedLink = await getOrCreateSharedLink(dropboxThumbPath);
              thumbnailUrl = convertToDirectLink(thumbSharedLink);
              
              cache[dropboxThumbPath] = {
                hash: thumbHash,
                parentHash: hash,
                dropboxPath: dropboxThumbPath,
                directUrl: thumbnailUrl
              };
            } catch (e) {
              console.error(`  Failed to upload thumbnail for ${filename}:`, e.message);
            }
          }
        }
      }
      
      // Add to result list
      resultData[categoryKey].push({
        name: filename,
        src: directUrl,
        thumbnail: thumbnailUrl || directUrl,
        isVideo: catInfo.isVideo
      });
    }
  }
  
  // Write cache
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  
  // Write output data
  fs.writeFileSync(OUTPUT_DATA_FILE, `var portfolioData = ${JSON.stringify(resultData, null, 2)};`, 'utf8');
  console.log(`\nSuccess! Gallery data written to ${OUTPUT_DATA_FILE}`);
}

run().catch(e => {
  console.error("Execution failed:", e);
  process.exit(1);
});
