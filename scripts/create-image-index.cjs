#!/usr/bin/env node

/**
 * Script pour créer un index des images disponibles
 */

const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'cards');
const INDEX_PATH = path.join(IMAGES_DIR, 'index.json');

console.log('📋 Creating image index...');

function createImageIndex() {
    try {
        if (!fs.existsSync(IMAGES_DIR)) {
            console.error('❌ Images directory not found:', IMAGES_DIR);
            return;
        }

        // Get all PNG files in the directory
        const files = fs.readdirSync(IMAGES_DIR);
        const imageFiles = files.filter(file => file.endsWith('.png'));

        const images = imageFiles.map(filename => {
            const cardId = path.basename(filename, '.png');
            return {
                id: cardId,
                filename: filename,
                path: `/images/cards/${filename}`,
                exists: true
            };
        });

        // Sort by card ID for better organization
        images.sort((a, b) => a.id.localeCompare(b.id));

        // Write the index file
        fs.writeFileSync(INDEX_PATH, JSON.stringify(images, null, 2));

        console.log(`✅ Created index with ${images.length} images`);
        console.log(`   • Index file: ${INDEX_PATH}`);

        // Show some statistics
        const seriesStats = {};
        images.forEach(img => {
            const series = img.id.split('-')[0];
            seriesStats[series] = (seriesStats[series] || 0) + 1;
        });

        console.log('\n📊 Images by series:');
        Object.entries(seriesStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([series, count]) => {
                console.log(`   • ${series}: ${count} images`);
            });

        return images.length;
    } catch (error) {
        console.error('❌ Failed to create image index:', error.message);
        return 0;
    }
}

// Run if called directly
if (require.main === module) {
    createImageIndex();
}

module.exports = { createImageIndex };