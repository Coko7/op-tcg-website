#!/usr/bin/env node

/**
 * Script pour télécharger uniquement les images depuis vegapull-records
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'cards');

console.log('🏴‍☠️ Downloading One Piece TCG images from Vegapull Records...');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

function downloadImageArchive(url, destination) {
    return new Promise((resolve, reject) => {
        console.log(`Starting download: ${url}`);

        const file = fs.createWriteStream(destination);

        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                return downloadImageArchive(response.headers.location, destination)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }

            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;

            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                if (totalSize) {
                    const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
                    process.stdout.write(`\r   Progress: ${percent}% (${(downloadedSize / 1024 / 1024).toFixed(1)} MB)`);
                }
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log('\n✅ Image archive downloaded successfully');
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destination, () => {});
            reject(err);
        });
    });
}

function extractImageArchive(zipPath) {
    return new Promise((resolve, reject) => {
        console.log('📦 Extracting image archive...');

        // Use system unzip command
        const extractCmd = process.platform === 'win32'
            ? `powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${IMAGES_DIR}' -Force"`
            : `unzip -o "${zipPath}" -d "${IMAGES_DIR}"`;

        exec(extractCmd, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Failed to extract archive:', error.message);
                reject(error);
                return;
            }

            console.log('✅ Images extracted successfully');

            // Create index.json
            createImageIndex();

            resolve();
        });
    });
}

function createImageIndex() {
    console.log('📋 Creating image index...');

    try {
        const imageFiles = fs.readdirSync(IMAGES_DIR)
            .filter(file => file.match(/\.(png|jpg|jpeg)$/i))
            .map(file => {
                const cardId = path.basename(file, path.extname(file));
                return {
                    id: cardId,
                    filename: file,
                    path: `/images/cards/${file}`,
                    exists: true
                };
            });

        const indexPath = path.join(IMAGES_DIR, 'index.json');
        fs.writeFileSync(indexPath, JSON.stringify(imageFiles, null, 2));

        console.log(`✅ Created index with ${imageFiles.length} images`);
    } catch (error) {
        console.error('❌ Failed to create image index:', error.message);
    }
}

async function downloadImages() {
    console.log('🖼️ Downloading images archive...');

    ensureDir(IMAGES_DIR);

    try {
        // Get latest release info
        console.log('Fetching latest release info...');

        const releaseUrl = 'https://api.github.com/repos/Coko7/vegapull-records/releases/latest';

        return new Promise((resolve, reject) => {
            https.get(releaseUrl, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', async () => {
                    try {
                        const release = JSON.parse(data);

                        // Find English images archive
                        const imageAsset = release.assets.find(asset =>
                            asset.name.includes('english-images') && asset.name.endsWith('.zip')
                        );

                        if (!imageAsset) {
                            throw new Error('No English images archive found in latest release');
                        }

                        console.log(`Found image archive: ${imageAsset.name} (${(imageAsset.size / 1024 / 1024).toFixed(1)} MB)`);
                        console.log('⚠️ This is a large download and may take several minutes...');

                        // Download the zip file
                        const zipPath = path.join(__dirname, '..', 'images.zip');
                        await downloadImageArchive(imageAsset.browser_download_url, zipPath);

                        // Extract the zip
                        await extractImageArchive(zipPath);

                        // Clean up
                        fs.unlinkSync(zipPath);

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    } catch (error) {
        console.error('❌ Failed to download images:', error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('🚀 Starting image download...');

        // Download images
        await downloadImages();

        console.log('\n🎉 Image download completed successfully!');
        console.log(`   • Images directory: ${IMAGES_DIR}`);
        console.log('\n🔄 Restart your application to use the new images!');

    } catch (error) {
        console.error('\n❌ Download failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { downloadImages, main };