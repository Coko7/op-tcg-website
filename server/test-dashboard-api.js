// Script de test pour vérifier l'API dashboard
const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3(dbPath);

console.log('🔍 Test de la requête dashboard stats...\n');

try {
  // Test de la requête userStats
  console.log('1️⃣ User Stats:');
  const userStats = db.prepare(`
    SELECT
      COUNT(*) as total_users,
      COUNT(CASE WHEN is_admin = 1 THEN 1 END) as total_admins,
      COUNT(CASE WHEN last_login >= datetime('now', '-24 hours') THEN 1 END) as active_today,
      COUNT(CASE WHEN last_login >= datetime('now', '-7 days') THEN 1 END) as active_week,
      COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_week,
      SUM(berrys) as total_berrys,
      AVG(berrys) as avg_berrys
    FROM users
    WHERE is_active = 1
  `).get();
  console.log(userStats);

  // Test de la requête totalCards
  console.log('\n2️⃣ Total Cards:');
  const totalCards = db.prepare(`
    SELECT COUNT(*) as total FROM cards WHERE is_active = 1
  `).get();
  console.log(totalCards);

  // Test de la requête collectionStats
  console.log('\n3️⃣ Collection Stats:');
  const collectionStats = db.prepare(`
    SELECT
      COUNT(DISTINCT card_id) as total,
      SUM(quantity) as total_cards_owned,
      COUNT(DISTINCT user_id) as users_with_cards
    FROM user_collections
  `).get();
  console.log(collectionStats);

  // Test de la requête avgCardsPerUser
  console.log('\n4️⃣ Avg Cards Per User:');
  const avgCardsPerUser = db.prepare(`
    SELECT COALESCE(AVG(total_cards), 0) as avg_per_user
    FROM (
      SELECT COUNT(DISTINCT card_id) as total_cards
      FROM user_collections
      GROUP BY user_id
    ) as subquery
  `).get();
  console.log(avgCardsPerUser);

  // Test de la requête boosterStats
  console.log('\n5️⃣ Booster Stats:');
  const boosterStats = db.prepare(`
    SELECT
      COUNT(*) as total_openings,
      COUNT(CASE WHEN opened_at >= datetime('now', '-24 hours') THEN 1 END) as opened_today,
      COUNT(CASE WHEN opened_at >= datetime('now', '-7 days') THEN 1 END) as opened_week
    FROM booster_openings
  `).get();
  console.log(boosterStats);

  // Test de la requête achievementStats
  console.log('\n6️⃣ Achievement Stats:');
  const achievementStats = db.prepare(`
    SELECT
      COUNT(DISTINCT a.id) as total,
      (SELECT COUNT(*)
       FROM user_achievements ua
       JOIN achievements a2 ON ua.achievement_id = a2.id
       WHERE ua.progress >= a2.threshold AND a2.is_active = 1) as completions,
      (SELECT COUNT(*)
       FROM user_achievements ua
       JOIN achievements a3 ON ua.achievement_id = a3.id
       WHERE ua.is_claimed = 1 AND a3.is_active = 1) as claimed
    FROM achievements a
    WHERE a.is_active = 1
  `).get();
  console.log(achievementStats);

  // Test de la requête topPlayers
  console.log('\n7️⃣ Top Players:');
  const topPlayers = db.prepare(`
    SELECT
      username,
      berrys,
      (SELECT COUNT(DISTINCT card_id) FROM user_collections WHERE user_id = users.id) as total_cards,
      (SELECT COALESCE(SUM(quantity), 0) FROM user_collections WHERE user_id = users.id) as cards_owned
    FROM users
    WHERE is_active = 1
    ORDER BY berrys DESC
    LIMIT 10
  `).all();
  console.log(topPlayers);

  // Test de la requête securityStats
  console.log('\n8️⃣ Security Stats:');
  const securityStats = db.prepare(`
    SELECT
      COUNT(CASE WHEN action = 'failed_login_attempt' THEN 1 END) as failed_logins,
      COUNT(CASE WHEN action = 'suspicious_activity' THEN 1 END) as suspicious_activities,
      COUNT(CASE WHEN action IN ('critical_error', 'security_breach') THEN 1 END) as critical_events
    FROM audit_logs
    WHERE created_at >= datetime('now', '-24 hours')
  `).get();
  console.log(securityStats);

  console.log('\n✅ Tous les tests réussis !');
} catch (error) {
  console.error('\n❌ Erreur:', error.message);
  console.error(error);
} finally {
  db.close();
}
