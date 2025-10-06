#!/usr/bin/env node

/**
 * Script pour télécharger les images One Piece avec Vegapull
 * Utilise l'outil Rust Vegapull pour récupérer toutes les images des cartes
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const VEGAPULL_PATH = path.join(__dirname, '..', 'vegapull', 'target', 'release', 'vegapull.exe');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'cards');
const LOG_FILE = path.join(__dirname, '..', 'download-images.log');

// Configuration
const PACKS_TO_DOWNLOAD = [
    'op01', 'op02', 'op03', 'op04', 'op05',
    'st01', 'st02', 'st03', 'st04', 'st05',
    'eb01', 'pr01'
];

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);

    try {
        fs.appendFileSync(LOG_FILE, logMessage + '\n');
    } catch (error) {
        console.warn('Failed to write to log file:', error.message);
    }
}

function ensureDirectoryExists(dir) {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`Created directory: ${dir}`);
        }
    } catch (error) {
        log(`Failed to create directory ${dir}: ${error.message}`);
        throw error;
    }
}

async function checkVegapullExists() {
    try {
        // Check if the compiled binary exists
        if (fs.existsSync(VEGAPULL_PATH)) {
            log(`Found Vegapull binary at: ${VEGAPULL_PATH}`);
            return true;
        }

        // Check if we can use cargo run instead
        const vegapullDir = path.join(__dirname, '..', 'vegapull');
        if (fs.existsSync(path.join(vegapullDir, 'Cargo.toml'))) {
            log(`Found Vegapull source at: ${vegapullDir}`);
            return vegapullDir;
        }

        throw new Error('Vegapull not found');
    } catch (error) {
        log(`Vegapull check failed: ${error.message}`);
        return false;
    }
}

function runVegapullCommand(args, cwd = null) {
    return new Promise((resolve, reject) => {
        let command, commandArgs;

        if (fs.existsSync(VEGAPULL_PATH)) {
            // Use compiled binary
            command = VEGAPULL_PATH;
            commandArgs = args;
        } else {
            // Use cargo run
            command = 'cargo';
            commandArgs = ['run', '--release', '--'].concat(args);
            cwd = cwd || path.join(__dirname, '..', 'vegapull');
        }

        log(`Running: ${command} ${commandArgs.join(' ')}`);

        const process = spawn(command, commandArgs, {
            cwd: cwd,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            // Log output in real-time
            text.split('\n').filter(line => line.trim()).forEach(line => {
                log(`[vegapull] ${line}`);
            });
        });

        process.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            text.split('\n').filter(line => line.trim()).forEach(line => {
                log(`[vegapull-err] ${line}`);
            });
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`Vegapull exited with code ${code}. stderr: ${stderr}`));
            }
        });

        process.on('error', (error) => {
            reject(new Error(`Failed to start vegapull: ${error.message}`));
        });
    });
}

async function downloadPack(packId) {
    log(`Starting download for pack: ${packId}`);

    try {
        // Try to download images for this pack
        await runVegapullCommand(['images', '-o', IMAGES_DIR, packId]);
        log(`Successfully downloaded images for pack: ${packId}`);
        return true;
    } catch (error) {
        log(`Failed to download pack ${packId}: ${error.message}`);
        return false;
    }
}

async function downloadAllPacks() {
    log('Starting bulk download of all packs...');

    let successCount = 0;
    let failCount = 0;

    for (const packId of PACKS_TO_DOWNLOAD) {
        try {
            const success = await downloadPack(packId);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }

            // Small delay between downloads to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            log(`Error downloading ${packId}: ${error.message}`);
            failCount++;
        }
    }

    log(`Download completed. Success: ${successCount}, Failed: ${failCount}`);
    return { successCount, failCount };
}

async function createImageIndex() {
    log('Creating image index...');

    try {
        const imageFiles = fs.readdirSync(IMAGES_DIR)
            .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
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

        log(`Created image index with ${imageFiles.length} images at: ${indexPath}`);
        return imageFiles;
    } catch (error) {
        log(`Failed to create image index: ${error.message}`);
        throw error;
    }
}

async function main() {
    log('='.repeat(50));
    log('One Piece Card Images Download Script');
    log('Using Vegapull CLI tool');
    log('='.repeat(50));

    try {
        // Check if Vegapull is available
        const vegapullPath = await checkVegapullExists();
        if (!vegapullPath) {
            throw new Error('Vegapull tool not found. Please compile it first with: cargo build --release');
        }

        // Ensure output directory exists
        ensureDirectoryExists(IMAGES_DIR);

        // Test vegapull with help command
        log('Testing Vegapull...');
        try {
            await runVegapullCommand(['--help']);
            log('Vegapull is working correctly');
        } catch (error) {
            log(`Vegapull test failed: ${error.message}`);
            throw error;
        }

        // Download all packs
        const results = await downloadAllPacks();

        // Create image index
        const imageFiles = await createImageIndex();

        log('='.repeat(50));
        log('Download Summary:');
        log(`- Successful downloads: ${results.successCount}`);
        log(`- Failed downloads: ${results.failCount}`);
        log(`- Total images found: ${imageFiles.length}`);
        log(`- Images directory: ${IMAGES_DIR}`);
        log('='.repeat(50));

        if (results.successCount > 0) {
            log('✅ Download completed successfully!');
            log('You can now use the downloaded images in your application.');
        } else {
            log('❌ No images were downloaded successfully.');
        }

    } catch (error) {
        log(`❌ Script failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = { downloadPack, downloadAllPacks, createImageIndex };