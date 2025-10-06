#!/usr/bin/env node

/**
 * Script pour télécharger quelques images d'exemple depuis les URLs officielles
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'cards');

// Quelques cartes populaires à télécharger comme exemple
const SAMPLE_CARDS = [
    { id: 'OP01-001', url: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png?250425' },
    { id: 'OP01-003', url: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png?250425' },
    { id: 'OP01-024', url: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-024.png?250425' },
    { id: 'OP01-025', url: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-025.png?250425' },
    { id: 'OP01-016', url: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-016.png?250425' },
    { id: 'OP02-001', url: 'https://en.onepiece-cardgame.com/images/cardlist/card/OP02-001.png?250425' },
];

console.log('🏴‍☠️ Downloading sample One Piece card images...');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);

        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                return downloadImage(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Delete partial file
            reject(err);
        });
    });
}

async function downloadSampleImages() {
    ensureDir(IMAGES_DIR);

    let successCount = 0;

    for (const card of SAMPLE_CARDS) {
        try {
            const filename = `${card.id}.png`;
            const filepath = path.join(IMAGES_DIR, filename);

            console.log(`Downloading ${card.id}...`);
            await downloadImage(card.url, filepath);

            console.log(`✅ Downloaded: ${filename}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to download ${card.id}: ${error.message}`);
        }
    }

    // Create index.json
    const imageIndex = SAMPLE_CARDS.map(card => ({
        id: card.id,
        filename: `${card.id}.png`,
        path: `/images/cards/${card.id}.png`,
        exists: true
    }));

    const indexPath = path.join(IMAGES_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(imageIndex, null, 2));
    console.log(`📋 Created index.json with ${imageIndex.length} entries`);

    console.log('🎉 Sample images download complete!');
    console.log(`   • Images downloaded: ${successCount}/${SAMPLE_CARDS.length}`);
    console.log(`   • Directory: ${IMAGES_DIR}`);

    return { successCount, total: SAMPLE_CARDS.length, images: imageIndex };
}

// Run if called directly
if (require.main === module) {
    downloadSampleImages().catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}

module.exports = { downloadSampleImages };