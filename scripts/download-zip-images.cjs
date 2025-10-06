#!/usr/bin/env node

/**
 * Script pour télécharger l'archive ZIP complète des images depuis GitHub
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

const IMAGES_ZIP_URL = 'https://github.com/Coko7/vegapull-records/releases/download/2025-04-27/english-images-2025-04-27.zip';
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'cards');
const ZIP_PATH = path.join(__dirname, '..', 'english-images.zip');

console.log('🏴‍☠️ Downloading complete One Piece card images archive...');
console.log(`URL: ${IMAGES_ZIP_URL}`);

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        console.log(`Starting download: ${url}`);
        console.log(`Destination: ${destination}`);

        const file = fs.createWriteStream(destination);

        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 302 || response.statusCode === 301) {
                console.log(`Following redirect to: ${response.headers.location}`);
                return downloadFile(response.headers.location, destination)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }

            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;
            let lastPercentage = 0;

            console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
            console.log('⚠️ This is a large download and may take several minutes...');

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (totalSize) {
                    const percentage = Math.floor((downloadedSize / totalSize) * 100);
                    if (percentage >= lastPercentage + 5) { // Show progress every 5%
                        console.log(`Progress: ${percentage}% (${(downloadedSize / 1024 / 1024).toFixed(1)} MB)`);
                        lastPercentage = percentage;
                    }
                }
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log('\n✅ Download completed successfully!');
                resolve();
            });

            file.on('error', (err) => {
                fs.unlink(destination, () => {});
                reject(err);
            });

        }).on('error', (err) => {
            fs.unlink(destination, () => {});
            reject(err);
        });
    });
}

function extractZip(zipPath, extractDir) {
    return new Promise((resolve, reject) => {
        console.log('📦 Extracting ZIP archive...');
        console.log(`From: ${zipPath}`);
        console.log(`To: ${extractDir}`);

        // Use PowerShell on Windows for extraction
        const extractCmd = process.platform === 'win32'
            ? `powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`
            : `unzip -o "${zipPath}" -d "${extractDir}"`;

        console.log(`Running: ${extractCmd}`);

        exec(extractCmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Failed to extract archive:', error.message);
                if (stderr) console.error('stderr:', stderr);
                reject(error);
                return;
            }

            console.log('✅ Archive extracted successfully!');
            if (stdout) console.log('stdout:', stdout);

            resolve();
        });
    });
}

function createImageIndex() {
    console.log('📋 Creating image index...');

    try {
        // Look for images in the extracted directory and subdirectories
        const findImages = (dir) => {
            let images = [];
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    images = images.concat(findImages(fullPath));
                } else if (item.match(/\.(png|jpg|jpeg)$/i)) {
                    const relativePath = path.relative(IMAGES_DIR, fullPath);
                    const cardId = path.basename(item, path.extname(item));
                    images.push({
                        id: cardId,
                        filename: item,
                        path: `/images/cards/${relativePath.replace(/\\/g, '/')}`,
                        exists: true
                    });
                }
            }

            return images;
        };

        const imageFiles = findImages(IMAGES_DIR);

        const indexPath = path.join(IMAGES_DIR, 'index.json');
        fs.writeFileSync(indexPath, JSON.stringify(imageFiles, null, 2));

        console.log(`✅ Created index with ${imageFiles.length} images`);
        return imageFiles.length;
    } catch (error) {
        console.error('❌ Failed to create image index:', error.message);
        return 0;
    }
}

async function main() {
    try {
        console.log('🚀 Starting ZIP download...');

        // Ensure directories exist
        ensureDir(IMAGES_DIR);

        // Download the ZIP file
        await downloadFile(IMAGES_ZIP_URL, ZIP_PATH);

        // Extract the ZIP
        await extractZip(ZIP_PATH, IMAGES_DIR);

        // Create image index
        const imageCount = createImageIndex();

        // Clean up ZIP file
        if (fs.existsSync(ZIP_PATH)) {
            fs.unlinkSync(ZIP_PATH);
            console.log('🗑️ Cleaned up ZIP file');
        }

        console.log('\n🎉 Image download and extraction completed successfully!');
        console.log(`   • Images extracted: ${imageCount}`);
        console.log(`   • Directory: ${IMAGES_DIR}`);
        console.log('\n🔄 Your application now has access to all One Piece card images!');

    } catch (error) {
        console.error('\n❌ Download failed:', error.message);

        // Clean up on failure
        if (fs.existsSync(ZIP_PATH)) {
            fs.unlinkSync(ZIP_PATH);
            console.log('🗑️ Cleaned up partial ZIP file');
        }

        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main };