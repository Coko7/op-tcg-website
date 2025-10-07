const Database = require('better-sqlite3');

const db = new Database('./database.sqlite');

console.log('🔄 Mise à jour des récompenses des achievements...');

// Mettre à jour les achievements 50% (Collectionneur)
const update50 = db.prepare(`
  UPDATE achievements
  SET reward_berrys = 500
  WHERE type = 'booster_cards' AND icon = '🎯'
`);
const result50 = update50.run();
console.log(`✅ ${result50.changes} achievements "Collectionneur" (50%) mis à jour: 250 -> 500 Berrys`);

// Mettre à jour les achievements 100% (Maître Complet)
const update100 = db.prepare(`
  UPDATE achievements
  SET reward_berrys = 1000
  WHERE type = 'booster_cards' AND icon = '👑'
`);
const result100 = update100.run();
console.log(`✅ ${result100.changes} achievements "Maître Complet" (100%) mis à jour: 500 -> 1000 Berrys`);

// Vérification
const verification = db.prepare(`
  SELECT icon, reward_berrys, COUNT(*) as count
  FROM achievements
  WHERE type = 'booster_cards'
  GROUP BY icon, reward_berrys
  ORDER BY reward_berrys
`).all();

console.log('\n📊 Répartition des récompenses:');
verification.forEach(row => {
  console.log(`  ${row.icon} - ${row.reward_berrys} Berrys: ${row.count} achievements`);
});

db.close();
console.log('\n✅ Mise à jour terminée!');
