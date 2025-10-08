import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { CardUpdateService } from '../services/CardUpdateService.js';
import { Database } from '../utils/database.js';

const router = Router();

// Toutes les routes admin nécessitent une authentification et des droits admin
router.use(authenticateToken);
router.use(requireAdmin);

// Route pour supprimer toutes les cartes et boosters (DANGER: admin uniquement)
router.post('/reset-all-data', async (req, res) => {
  try {
    console.log('🗑️ Suppression de toutes les données...');

    // Supprimer les collections utilisateur en premier
    await Database.run('DELETE FROM user_collections');
    console.log('✓ Collections utilisateur supprimées');

    // Supprimer les ouvertures de boosters
    await Database.run('DELETE FROM booster_openings');
    console.log('✓ Ouvertures de boosters supprimées');

    // Supprimer toutes les cartes
    await Database.run('DELETE FROM cards');
    const cardsDeleted = await Database.get('SELECT changes() as count');
    console.log(`🃏 ${cardsDeleted.count} cartes supprimées`);

    // Supprimer tous les boosters
    await Database.run('DELETE FROM boosters');
    const boostersDeleted = await Database.get('SELECT changes() as count');
    console.log(`📦 ${boostersDeleted.count} boosters supprimés`);

    console.log('✅ Toutes les données ont été supprimées');

    res.json({
      success: true,
      message: 'Toutes les données ont été supprimées',
      cardsDeleted: cardsDeleted.count,
      boostersDeleted: boostersDeleted.count
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour vérifier la distribution des cartes par booster
router.get('/check-booster-cards-temp', async (req, res) => {
  try {
    const boosters = await Database.all(`
      SELECT id, code, name FROM boosters WHERE is_active = 1
    `);

    const distribution = [];

    for (const booster of boosters) {
      const cardCount = await Database.get(`
        SELECT COUNT(*) as count FROM cards WHERE booster_id = ?
      `, [booster.id]);

      distribution.push({
        id: booster.id,
        code: booster.code,
        name: booster.name,
        cardCount: cardCount.count
      });
    }

    res.json({
      success: true,
      distribution
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour nettoyer les boosters en double
router.post('/clean-duplicate-boosters-temp', async (req, res) => {
  try {
    console.log('🧹 Nettoyage des boosters en double...');

    const boosters = await Database.all(`
      SELECT id, code, name, created_at
      FROM boosters
      WHERE is_active = 1
      ORDER BY code, created_at ASC
    `);

    console.log(`📦 ${boosters.length} boosters trouvés`);

    const boostersByCode: Record<string, any[]> = {};
    for (const booster of boosters) {
      if (!boostersByCode[booster.code]) {
        boostersByCode[booster.code] = [];
      }
      boostersByCode[booster.code].push(booster);
    }

    let deleted = 0;
    const kept: string[] = [];
    const removed: string[] = [];

    for (const [code, boosterList] of Object.entries(boostersByCode)) {
      if (boosterList.length > 1) {
        console.log(`\n🔍 Code ${code}: ${boosterList.length} versions trouvées`);
        console.log(`   ✓ Garder: ${boosterList[0].id}`);
        kept.push(boosterList[0].id);

        for (let i = 1; i < boosterList.length; i++) {
          console.log(`   ✗ Supprimer: ${boosterList[i].id}`);

          // D'abord, mettre à jour les références dans booster_openings vers le booster à garder
          await Database.run(
            'UPDATE booster_openings SET booster_id = ? WHERE booster_id = ?',
            [boosterList[0].id, boosterList[i].id]
          );

          // Mettre à jour les cartes avec ce booster_id
          await Database.run(
            'UPDATE cards SET booster_id = ? WHERE booster_id = ?',
            [boosterList[0].id, boosterList[i].id]
          );

          // Ensuite supprimer le booster en double
          await Database.run('DELETE FROM boosters WHERE id = ?', [boosterList[i].id]);
          removed.push(boosterList[i].id);
          deleted++;
        }
      } else {
        kept.push(boosterList[0].id);
      }
    }

    const remaining = await Database.get('SELECT COUNT(*) as count FROM boosters WHERE is_active = 1');
    console.log(`\n✅ ${deleted} boosters en double supprimés`);
    console.log(`📦 ${remaining.count} boosters uniques restants`);

    res.json({
      success: true,
      message: `${deleted} boosters en double supprimés`,
      deleted,
      remaining: remaining.count
    });

  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour vérifier la distribution des cartes par booster
router.get('/check-booster-cards', async (req, res) => {
  try {
    const boosters = await Database.all(`
      SELECT id, code, name FROM boosters WHERE is_active = 1
    `);

    const distribution = [];

    for (const booster of boosters) {
      const cardCount = await Database.get(`
        SELECT COUNT(*) as count FROM cards WHERE booster_id = ?
      `, [booster.id]);

      distribution.push({
        id: booster.id,
        code: booster.code,
        name: booster.name,
        cardCount: cardCount.count
      });
    }

    res.json({
      success: true,
      distribution
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour nettoyer les cartes avec booster_id inexistant
router.post('/fix-cards-booster-id', async (req, res) => {
  try {
    console.log('🔧 Correction des booster_id des cartes...');

    // Récupérer tous les IDs de boosters valides
    const validBoosters = await Database.all(`
      SELECT id FROM boosters WHERE is_active = 1
    `);
    const validBoosterIds = validBoosters.map(b => b.id);

    console.log(`📦 ${validBoosterIds.length} boosters valides trouvés`);

    // Trouver les cartes avec booster_id invalide
    const cardsWithInvalidBooster = await Database.all(`
      SELECT id, booster_id, name
      FROM cards
      WHERE booster_id IS NOT NULL
        AND booster_id NOT IN (${validBoosterIds.map(() => '?').join(',')})
    `, validBoosterIds);

    console.log(`🃏 ${cardsWithInvalidBooster.length} cartes avec booster_id invalide`);

    if (cardsWithInvalidBooster.length === 0) {
      res.json({
        success: true,
        message: 'Aucune carte avec booster_id invalide',
        fixed: 0
      });
      return;
    }

    // Mettre à jour vers NULL ou vers un booster valide aléatoire
    const randomValidBoosterId = validBoosterIds[0]; // Prendre le premier booster valide

    for (const card of cardsWithInvalidBooster) {
      console.log(`   Carte "${card.name}" (${card.id}): ${card.booster_id} -> ${randomValidBoosterId}`);
      await Database.run(
        'UPDATE cards SET booster_id = ? WHERE id = ?',
        [randomValidBoosterId, card.id]
      );
    }

    console.log(`\n✅ ${cardsWithInvalidBooster.length} cartes corrigées`);

    res.json({
      success: true,
      message: `${cardsWithInvalidBooster.length} cartes corrigées`,
      fixed: cardsWithInvalidBooster.length
    });

  } catch (error) {
    console.error('Erreur lors de la correction:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour forcer une mise à jour des cartes/boosters
router.post('/update-cards', async (req, res) => {
  try {
    const { force = false } = req.body;

    // Validation: force doit être un booléen
    if (typeof force !== 'boolean') {
      res.status(400).json({
        error: 'Le paramètre force doit être un booléen'
      });
      return;
    }

    console.log('🔄 Début de la mise à jour des cartes/boosters...');
    const updateService = new CardUpdateService();
    const result = await updateService.updateFromVegapull(force);

    if (result.success) {
      res.json({
        message: 'Mise à jour terminée avec succès',
        result
      });
    } else {
      res.status(500).json({
        error: 'Échec de la mise à jour',
        result
      });
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Route pour récupérer l'historique des mises à jour
router.get('/update-history', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 10, 100));

    const updateService = new CardUpdateService();
    const history = await updateService.getUpdateHistory(limit);

    res.json({
      history
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour restaurer des cartes supprimées
router.post('/restore-cards', async (req, res) => {
  try {
    const { cardIds } = req.body;

    if (!cardIds || !Array.isArray(cardIds)) {
      res.status(400).json({
        error: 'Liste des IDs de cartes requise'
      });
      return;
    }

    // Validation: limite de 1000 cartes max à restaurer
    if (cardIds.length === 0 || cardIds.length > 1000) {
      res.status(400).json({
        error: 'Le nombre de cartes à restaurer doit être entre 1 et 1000'
      });
      return;
    }

    // Validation: tous les IDs doivent être des strings
    if (!cardIds.every(id => typeof id === 'string')) {
      res.status(400).json({
        error: 'Tous les IDs doivent être des chaînes de caractères'
      });
      return;
    }

    const updateService = new CardUpdateService();
    const restored = await updateService.restoreRemovedCards(cardIds);

    res.json({
      message: `${restored} cartes restaurées avec succès`,
      restored
    });

  } catch (error) {
    console.error('Erreur lors de la restauration:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

export default router;