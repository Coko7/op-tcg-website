#!/usr/bin/env node

/**
 * Script de vérification de sécurité
 * Vérifie que toutes les mesures de sécurité critiques sont en place
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function pass(message) {
  checks.passed++;
  log(`✅ ${message}`, 'green');
}

function fail(message) {
  checks.failed++;
  log(`❌ ${message}`, 'red');
}

function warn(message) {
  checks.warnings++;
  log(`⚠️  ${message}`, 'yellow');
}

log('\n🔒 Vérification de sécurité\n', 'blue');

// 1. Vérifier l'existence du fichier .env
log('📋 Vérification des fichiers de configuration...', 'blue');
if (fs.existsSync('.env')) {
  pass('Fichier .env trouvé');
  
  // Lire le contenu
  const envContent = fs.readFileSync('.env', 'utf-8');
  
  // Vérifier JWT_SECRET
  if (envContent.includes('JWT_SECRET=') && !envContent.includes('JWT_SECRET=your-super-secret')) {
    pass('JWT_SECRET est configuré');
  } else {
    fail('JWT_SECRET n\'est pas configuré ou utilise une valeur par défaut');
  }
  
  // Vérifier JWT_REFRESH_SECRET
  if (envContent.includes('JWT_REFRESH_SECRET=') && !envContent.includes('JWT_REFRESH_SECRET=CHANGE')) {
    pass('JWT_REFRESH_SECRET est configuré');
  } else {
    fail('JWT_REFRESH_SECRET n\'est pas configuré ou utilise une valeur par défaut');
  }
  
  // Vérifier NODE_ENV
  if (envContent.includes('NODE_ENV=production')) {
    warn('NODE_ENV=production détecté (assurez-vous que c\'est intentionnel)');
  } else {
    pass('NODE_ENV n\'est pas en production (OK pour développement)');
  }
  
  // Vérifier ALLOWED_ORIGINS
  if (envContent.includes('ALLOWED_ORIGINS=')) {
    pass('ALLOWED_ORIGINS est configuré');
  } else {
    warn('ALLOWED_ORIGINS n\'est pas configuré (utilisera les valeurs par défaut)');
  }
} else {
  fail('Fichier .env non trouvé');
  warn('Créez un fichier .env basé sur .env.example');
}

// 2. Vérifier .gitignore
log('\n📋 Vérification de .gitignore...', 'blue');
if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf-8');
  
  if (gitignoreContent.includes('.env')) {
    pass('.env est dans .gitignore');
  } else {
    fail('.env n\'est PAS dans .gitignore (CRITIQUE!)');
  }
  
  if (gitignoreContent.includes('*.sqlite')) {
    pass('Fichiers de base de données dans .gitignore');
  } else {
    warn('Fichiers de base de données pas dans .gitignore');
  }
} else {
  fail('Fichier .gitignore non trouvé');
}

// 3. Vérifier les dépendances de sécurité
log('\n📦 Vérification des dépendances...', 'blue');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (deps['helmet']) {
    pass('helmet installé');
  } else {
    fail('helmet n\'est pas installé');
  }
  
  if (deps['express-rate-limit']) {
    pass('express-rate-limit installé');
  } else {
    fail('express-rate-limit n\'est pas installé');
  }
  
  if (deps['bcryptjs'] || deps['bcrypt']) {
    pass('bcryptjs/bcrypt installé');
  } else {
    fail('bcryptjs/bcrypt n\'est pas installé');
  }
  
  if (deps['jsonwebtoken']) {
    pass('jsonwebtoken installé');
  } else {
    fail('jsonwebtoken n\'est pas installé');
  }
  
  if (deps['cors']) {
    pass('cors installé');
  } else {
    fail('cors n\'est pas installé');
  }
} else {
  fail('package.json non trouvé');
}

// 4. Vérifier les fichiers de sécurité
log('\n📁 Vérification des fichiers de sécurité...', 'blue');

const securityFiles = [
  'src/middleware/security.ts',
  'src/middleware/auth.ts',
  'src/middleware/validation.ts'
];

securityFiles.forEach(file => {
  if (fs.existsSync(file)) {
    pass(`${file} existe`);
  } else {
    fail(`${file} n\'existe pas`);
  }
});

// 5. Vérifier les routes admin
log('\n🛡️  Vérification des routes admin...', 'blue');
if (fs.existsSync('src/routes/admin.ts')) {
  const adminRoutes = fs.readFileSync('src/routes/admin.ts', 'utf-8');
  
  if (adminRoutes.includes('authenticateToken') && adminRoutes.includes('requireAdmin')) {
    pass('Routes admin protégées par authentification');
  } else {
    fail('Routes admin ne semblent pas protégées');
  }
} else {
  warn('Fichier admin.ts non trouvé');
}

// Résumé
log('\n' + '='.repeat(50), 'blue');
log('📊 RÉSUMÉ', 'blue');
log('='.repeat(50), 'blue');
log(`✅ Tests réussis: ${checks.passed}`, 'green');
log(`❌ Tests échoués: ${checks.failed}`, 'red');
log(`⚠️  Avertissements: ${checks.warnings}`, 'yellow');

if (checks.failed > 0) {
  log('\n⚠️  ATTENTION: Des problèmes de sécurité ont été détectés!', 'red');
  log('Veuillez corriger les problèmes avant de déployer en production.', 'red');
  process.exit(1);
} else if (checks.warnings > 0) {
  log('\n⚠️  Certains avertissements ont été émis.', 'yellow');
  log('Veuillez les examiner avant de déployer en production.', 'yellow');
  process.exit(0);
} else {
  log('\n✅ Toutes les vérifications de sécurité ont réussi!', 'green');
  process.exit(0);
}
