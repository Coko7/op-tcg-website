const Database = require('./dist/utils/database').Database;

async function cleanDuplicateBoosters() {
  console.log('🧹 Nettoyage des boosters en double...');
  
  await Database.initialize();
  
  // Récupérer tous les codes de boosters avec leurs IDs
  const boosters = await Database.all(`
    SELECT id, code, name, created_at 
    FROM boosters 
    WHERE is_active = 1 
    ORDER BY code, created_at ASC
  `);
  
  console.log(`📦 ${boosters.length} boosters trouvés`);
  
  // Grouper par code
  const boostersByCode = {};
  for (const booster of boosters) {
    if (!boostersByCode[booster.code]) {
      boostersByCode[booster.code] = [];
    }
    boostersByCode[booster.code].push(booster);
  }
  
  // Pour chaque code, garder le premier et désactiver les autres
  let deactivated = 0;
  for (const [code, boosterList] of Object.entries(boostersByCode)) {
    if (boosterList.length > 1) {
      console.log(`\n🔍 Code ${code}: ${boosterList.length} versions trouvées`);
      console.log(`   ✓ Garder: ${boosterList[0].id} (${boosterList[0].name})`);
      
      for (let i = 1; i < boosterList.length; i++) {
        console.log(`   ✗ Supprimer: ${boosterList[i].id}`);
        await Database.run('DELETE FROM boosters WHERE id = ?', [boosterList[i].id]);
        deactivated++;
      }
    }
  }
  
  console.log(`\n✅ ${deactivated} boosters en double supprimés`);
  
  const remaining = await Database.get('SELECT COUNT(*) as count FROM boosters WHERE is_active = 1');
  console.log(`📦 ${remaining.count} boosters uniques restants`);
}

cleanDuplicateBoosters().catch(console.error);
