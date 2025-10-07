const fs = require('fs');
const path = require('path');

// Fonction pour corriger les datetime('now') dans un fichier
function fixDatetimeInFile(filePath) {
  console.log(`📝 Traitement: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Compter les occurrences avant
  const beforeCount = (content.match(/datetime\(['"]now['"]\)/g) || []).length;

  if (beforeCount === 0) {
    console.log(`  ℹ️  Aucune occurrence trouvée`);
    return;
  }

  console.log(`  🔍 ${beforeCount} occurrence(s) trouvée(s)`);

  // Pattern pour trouver les fonctions qui contiennent datetime('now')
  const lines = content.split('\n');
  const newLines = [];
  let needsNowVariable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('datetime(\'now\')') || line.includes('datetime("now")')) {
      // Trouver la fonction parente
      let functionStart = i;
      for (let j = i; j >= 0; j--) {
        if (lines[j].match(/(static\s+)?async\s+\w+\s*\(/) || lines[j].match(/^\s*(const|let)\s+\w+\s*=\s*async/)) {
          functionStart = j;
          break;
        }
      }

      // Vérifier si la fonction a déjà une variable 'now'
      let hasNowVariable = false;
      for (let j = functionStart; j < i; j++) {
        if (lines[j].includes('const now = ') || lines[j].includes('const nowISO = ')) {
          hasNowVariable = true;
          break;
        }
      }

      // Insérer la variable now si nécessaire
      if (!hasNowVariable && !needsNowVariable) {
        // Trouver l'indentation
        const indent = line.match(/^(\s*)/)[1];

        // Chercher la ligne après l'ouverture de la fonction
        for (let j = functionStart; j < i; j++) {
          if (lines[j].includes('{')) {
            newLines.push(lines[j]);
            newLines.push(indent + '  const now = new Date().toISOString();');
            needsNowVariable = true;
            modified = true;
            continue;
          }
          newLines.push(lines[j]);
        }
        i = i - 1; // Retraiter cette ligne
        continue;
      }

      // Remplacer datetime('now') par ?
      let newLine = line
        .replace(/datetime\(['"]now['"]\)/g, '?')
        .replace(/VALUES\s*\((.*?)\)/, (match, params) => {
          // Ajouter 'now' comme paramètre
          const parts = params.split(',').map(p => p.trim());
          const newParts = parts.map(part => {
            if (part === '?') {
              // C'est déjà un paramètre, on ne change rien
              return part;
            }
            return part;
          });

          // Trouver où insérer 'now'
          // On cherche le ? qui a remplacé datetime('now')
          if (match !== line) {
            return match; // Pas de changement
          }
          return match;
        });

      // Cas simple: remplacer datetime('now') par ?
      newLine = line.replace(/datetime\(['"]now['"]\)/g, '?');

      newLines.push(newLine);
      modified = true;
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    // Note: Ce script est incomplet et risqué. Mieux vaut le faire manuellement.
    console.log(`  ⚠️  Modification nécessaire mais complexe. Faites-le manuellement.`);
  }
}

// Parcourir tous les fichiers .ts dans src/
function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fixDatetimeInFile(filePath);
    }
  });
}

console.log('🔧 Correction des datetime("now") dans le code...\n');
walkDir(path.join(__dirname, 'src'));
console.log('\n✅ Analyse terminée');
