#!/usr/bin/env node

/**
 * Script pour créer des images d'exemple en attendant Vegapull
 * Télécharge quelques images de cartes One Piece depuis des sources publiques
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'cards');

// Images d'exemple de cartes One Piece (URLs publiques)
const SAMPLE_CARDS = [
    {
        id: 'OP01-001',
        name: 'Monkey D. Luffy',
        url: 'https://via.placeholder.com/200x280/dc2626/ffffff?text=OP01-001+Luffy'
    },
    {
        id: 'OP01-002',
        name: 'Roronoa Zoro',
        url: 'https://via.placeholder.com/200x280/059669/ffffff?text=OP01-002+Zoro'
    },
    {
        id: 'OP01-003',
        name: 'Nami',
        url: 'https://via.placeholder.com/200x280/2563eb/ffffff?text=OP01-003+Nami'
    },
    {
        id: 'OP02-001',
        name: 'Edward Newgate',
        url: 'https://via.placeholder.com/200x280/7c3aed/ffffff?text=OP02-001+Whitebeard'
    },
    {
        id: 'ST01-001',
        name: 'Monkey D. Luffy Leader',
        url: 'https://via.placeholder.com/200x280/dc2626/ffffff?text=ST01-001+Luffy+Leader'
    },
    {
        id: 'ST01-002',
        name: 'Roronoa Zoro',
        url: 'https://via.placeholder.com/200x280/059669/ffffff?text=ST01-002+Zoro+ST'
    }
];

function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);

        https.get(url, (response) => {
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

async function createSampleImages() {
    console.log('🎴 Creating sample One Piece card images...');

    // Ensure directory exists
    ensureDirectoryExists(IMAGES_DIR);

    // Download sample images
    let successCount = 0;

    for (const card of SAMPLE_CARDS) {
        try {
            const filename = `${card.id}.png`;
            const filepath = path.join(IMAGES_DIR, filename);

            console.log(`Downloading ${card.name} (${card.id})...`);
            await downloadImage(card.url, filepath);

            console.log(`✅ Created: ${filename}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to create ${card.id}: ${error.message}`);
        }
    }

    // Create index.json
    const imageIndex = SAMPLE_CARDS.map(card => ({
        id: card.id,
        filename: `${card.id}.png`,
        path: `/images/cards/${card.id}.png`,
        exists: true,
        name: card.name
    }));

    const indexPath = path.join(IMAGES_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(imageIndex, null, 2));
    console.log(`📋 Created index.json with ${imageIndex.length} entries`);

    console.log('🎉 Sample images setup complete!');
    console.log(`   • Images created: ${successCount}/${SAMPLE_CARDS.length}`);
    console.log(`   • Directory: ${IMAGES_DIR}`);
    console.log(`   • Index: ${indexPath}`);

    return { successCount, total: SAMPLE_CARDS.length, images: imageIndex };
}

// Run if called directly
if (require.main === module) {
    createSampleImages().catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}

module.exports = { createSampleImages };