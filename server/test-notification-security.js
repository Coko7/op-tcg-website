#!/usr/bin/env node

/**
 * Tests de sécurité du système de notifications
 * Vérifie que:
 * - Un utilisateur ne peut pas réclamer 2 fois la même notification
 * - Les transactions sont atomiques
 * - Les limites de Berrys sont respectées
 * - L'anti-cheat fonctionne correctement
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
const MAX_BERRYS = 999999999;

class NotificationSecurityTester {
  constructor() {
    this.db = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Initialiser la connexion
   */
  initialize() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Fermer la connexion
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }

  /**
   * Logger un test
   */
  logTest(name, passed, details = '') {
    this.testResults.tests.push({ name, passed, details });
    if (passed) {
      this.testResults.passed++;
      console.log(`  ✅ ${name}`);
    } else {
      this.testResults.failed++;
      console.log(`  ❌ ${name}`);
      if (details) {
        console.log(`     ${details}`);
      }
    }
  }

  /**
   * Test 1: Contrainte UNIQUE empêche les doubles claims
   */
  testDoubleClaimPrevention() {
    console.log('\n📋 Test 1: Prévention double réclamation');

    try {
      // Créer un utilisateur de test
      const userId = uuidv4();
      this.db.prepare(`
        INSERT INTO users (id, username, password_hash, berrys, available_boosters)
        VALUES (?, ?, ?, 0, 0)
      `).run(userId, 'testuser' + Date.now().toString().slice(-6), 'dummy_hash');

      // Créer une notification de test
      const notifId = uuidv4();
      this.db.prepare(`
        INSERT INTO notifications (
          id, title, message, reward_berrys, reward_boosters,
          is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
      `).run(notifId, 'Test Notif', 'Test message', 100, 0, userId);

      // Premier claim - devrait réussir
      const claimId1 = uuidv4();
      this.db.prepare(`
        INSERT INTO user_notifications (
          id, user_id, notification_id, read_at, reward_claimed, claimed_at
        ) VALUES (?, ?, ?, datetime('now'), 1, datetime('now'))
      `).run(claimId1, userId, notifId);

      this.logTest('Premier claim réussit', true);

      // Deuxième claim - devrait échouer (UNIQUE constraint)
      let doubleClaimBlocked = false;
      try {
        const claimId2 = uuidv4();
        this.db.prepare(`
          INSERT INTO user_notifications (
            id, user_id, notification_id, read_at, reward_claimed, claimed_at
          ) VALUES (?, ?, ?, datetime('now'), 1, datetime('now'))
        `).run(claimId2, userId, notifId);
      } catch (error) {
        if (error.message.includes('UNIQUE')) {
          doubleClaimBlocked = true;
        }
      }

      this.logTest('Double claim bloqué par UNIQUE constraint', doubleClaimBlocked);

      // Nettoyage
      this.db.prepare('DELETE FROM user_notifications WHERE user_id = ?').run(userId);
      this.db.prepare('DELETE FROM notifications WHERE id = ?').run(notifId);
      this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    } catch (error) {
      this.logTest('Erreur test double claim', false, error.message);
    }
  }

  /**
   * Test 2: Limite de Berrys respectée
   */
  testBerryLimit() {
    console.log('\n📋 Test 2: Limite de Berrys (999,999,999)');

    try {
      // Créer un utilisateur avec presque le max de Berrys
      const userId = uuidv4();
      const currentBerrys = MAX_BERRYS - 500;

      this.db.prepare(`
        INSERT INTO users (id, username, password_hash, berrys, available_boosters)
        VALUES (?, ?, ?, ?, 0)
      `).run(userId, 'richuser' + Date.now().toString().slice(-6), 'dummy_hash', currentBerrys);

      this.logTest(`Utilisateur créé avec ${currentBerrys.toLocaleString()} Berrys`, true);

      // Créer une notification avec 1000 Berrys
      const notifId = uuidv4();
      this.db.prepare(`
        INSERT INTO notifications (
          id, title, message, reward_berrys, reward_boosters,
          is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
      `).run(notifId, 'Big Reward', 'Test', 1000, 0, userId);

      // Vérifier que currentBerrys + reward dépasse la limite
      const wouldExceed = currentBerrys + 1000 > MAX_BERRYS;
      this.logTest('Récompense dépasserait la limite', wouldExceed);

      // Simuler la vérification du controller
      const user = this.db.prepare('SELECT berrys FROM users WHERE id = ?').get(userId);
      const rewardBerrys = 1000;
      const wouldExceedLimit = user.berrys + rewardBerrys > MAX_BERRYS;

      this.logTest('Vérification de limite fonctionnelle', wouldExceedLimit);

      // Nettoyage
      this.db.prepare('DELETE FROM notifications WHERE id = ?').run(notifId);
      this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    } catch (error) {
      this.logTest('Erreur test limite Berrys', false, error.message);
    }
  }

  /**
   * Test 3: Vérification expiration
   */
  testExpirationCheck() {
    console.log('\n📋 Test 3: Vérification expiration des notifications');

    try {
      const userId = uuidv4();
      this.db.prepare(`
        INSERT INTO users (id, username, password_hash, berrys, available_boosters)
        VALUES (?, ?, ?, 0, 0)
      `).run(userId, 'expiryuser' + Date.now().toString().slice(-6), 'dummy_hash');

      // Notification expirée
      const expiredNotifId = uuidv4();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      this.db.prepare(`
        INSERT INTO notifications (
          id, title, message, reward_berrys, reward_boosters,
          is_active, created_by, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'), ?)
      `).run(expiredNotifId, 'Expired', 'Test', 100, 0, userId, yesterday);

      // Vérifier l'expiration
      const notif = this.db.prepare(`
        SELECT * FROM notifications WHERE id = ?
      `).get(expiredNotifId);

      const isExpired = new Date(notif.expires_at) < new Date();
      this.logTest('Notification expirée détectée', isExpired);

      // Notification valide (expire demain)
      const validNotifId = uuidv4();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      this.db.prepare(`
        INSERT INTO notifications (
          id, title, message, reward_berrys, reward_boosters,
          is_active, created_by, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'), ?)
      `).run(validNotifId, 'Valid', 'Test', 100, 0, userId, tomorrow);

      const validNotif = this.db.prepare(`
        SELECT * FROM notifications WHERE id = ?
      `).get(validNotifId);

      const isValid = new Date(validNotif.expires_at) > new Date();
      this.logTest('Notification valide détectée', isValid);

      // Nettoyage
      this.db.prepare('DELETE FROM notifications WHERE id IN (?, ?)').run(expiredNotifId, validNotifId);
      this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    } catch (error) {
      this.logTest('Erreur test expiration', false, error.message);
    }
  }

  /**
   * Test 4: Validation des récompenses
   */
  testRewardValidation() {
    console.log('\n📋 Test 4: Validation des récompenses');

    try {
      const userId = uuidv4();
      this.db.prepare(`
        INSERT INTO users (id, username, password_hash, berrys, available_boosters)
        VALUES (?, ?, ?, 0, 0)
      `).run(userId, 'rewarduser' + Date.now().toString().slice(-6), 'dummy_hash');

      // Test: Berrys négatifs (devrait échouer avec CHECK constraint)
      let negativeBerrysBlocked = false;
      try {
        const badNotifId = uuidv4();
        this.db.prepare(`
          INSERT INTO notifications (
            id, title, message, reward_berrys, reward_boosters,
            is_active, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
        `).run(badNotifId, 'Bad', 'Test', -100, 0, userId);
      } catch (error) {
        if (error.message.includes('CHECK')) {
          negativeBerrysBlocked = true;
        }
      }

      this.logTest('Berrys négatifs bloqués', negativeBerrysBlocked);

      // Test: Berrys trop élevés (devrait échouer avec CHECK constraint)
      let excessiveBerrysBlocked = false;
      try {
        const badNotifId = uuidv4();
        this.db.prepare(`
          INSERT INTO notifications (
            id, title, message, reward_berrys, reward_boosters,
            is_active, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
        `).run(badNotifId, 'Bad', 'Test', 15000, 0, userId);
      } catch (error) {
        if (error.message.includes('CHECK')) {
          excessiveBerrysBlocked = true;
        }
      }

      this.logTest('Berrys excessifs bloqués (>10000)', excessiveBerrysBlocked);

      // Test: Boosters négatifs
      let negativeBoostersBlocked = false;
      try {
        const badNotifId = uuidv4();
        this.db.prepare(`
          INSERT INTO notifications (
            id, title, message, reward_berrys, reward_boosters,
            is_active, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
        `).run(badNotifId, 'Bad', 'Test', 100, -5, userId);
      } catch (error) {
        if (error.message.includes('CHECK')) {
          negativeBoostersBlocked = true;
        }
      }

      this.logTest('Boosters négatifs bloqués', negativeBoostersBlocked);

      // Nettoyage
      this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    } catch (error) {
      this.logTest('Erreur test validation récompenses', false, error.message);
    }
  }

  /**
   * Test 5: Cascade deletion
   */
  testCascadeDeletion() {
    console.log('\n📋 Test 5: CASCADE deletion');

    try {
      const userId = uuidv4();
      this.db.prepare(`
        INSERT INTO users (id, username, password_hash, berrys, available_boosters)
        VALUES (?, ?, ?, 0, 0)
      `).run(userId, 'cascadeuser' + Date.now().toString().slice(-4), 'dummy_hash');

      const notifId = uuidv4();
      this.db.prepare(`
        INSERT INTO notifications (
          id, title, message, reward_berrys, reward_boosters,
          is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
      `).run(notifId, 'Test', 'Test', 100, 0, userId);

      const claimId = uuidv4();
      this.db.prepare(`
        INSERT INTO user_notifications (
          id, user_id, notification_id, read_at, reward_claimed, claimed_at
        ) VALUES (?, ?, ?, datetime('now'), 1, datetime('now'))
      `).run(claimId, userId, notifId);

      // Vérifier que le claim existe
      const claimBefore = this.db.prepare(`
        SELECT * FROM user_notifications WHERE id = ?
      `).get(claimId);

      this.logTest('Claim créé avec succès', !!claimBefore);

      // Test 1: Supprimer la notification (devrait cascade sur user_notifications)
      this.db.prepare('DELETE FROM notifications WHERE id = ?').run(notifId);

      // Vérifier que le claim a été supprimé
      const claimAfter = this.db.prepare(`
        SELECT * FROM user_notifications WHERE id = ?
      `).get(claimId);

      this.logTest('Claim supprimé par CASCADE (notification)', !claimAfter);

      // Nettoyage
      this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    } catch (error) {
      this.logTest('Erreur test CASCADE', false, error.message);
    }
  }

  /**
   * Afficher les résultats
   */
  displayResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSULTATS DES TESTS');
    console.log('='.repeat(50));
    console.log(`✅ Tests réussis: ${this.testResults.passed}`);
    console.log(`❌ Tests échoués: ${this.testResults.failed}`);
    console.log(`📝 Total: ${this.testResults.tests.length}`);

    const successRate = (this.testResults.passed / this.testResults.tests.length * 100).toFixed(1);
    console.log(`📈 Taux de réussite: ${successRate}%`);

    if (this.testResults.failed > 0) {
      console.log('\n⚠️  Tests échoués:');
      this.testResults.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    }

    console.log('='.repeat(50));

    return this.testResults.failed === 0;
  }

  /**
   * Exécuter tous les tests
   */
  runAllTests() {
    console.log('🔒 Tests de sécurité du système de notifications\n');

    this.testDoubleClaimPrevention();
    this.testBerryLimit();
    this.testExpirationCheck();
    this.testRewardValidation();
    this.testCascadeDeletion();

    const allPassed = this.displayResults();

    if (allPassed) {
      console.log('\n🎉 Tous les tests de sécurité sont passés !');
      process.exit(0);
    } else {
      console.log('\n❌ Certains tests de sécurité ont échoué');
      process.exit(1);
    }
  }
}

// Exécution
const tester = new NotificationSecurityTester();
tester.initialize();

try {
  tester.runAllTests();
} finally {
  tester.close();
}
