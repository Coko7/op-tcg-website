import { Database } from '../utils/database.js';
import { AchievementService } from '../services/AchievementService.js';
async function initializeAchievements() {
    try {
        console.log('🏆 Initialisation des achievements...\n');
        // Initialiser la base de données
        await Database.initialize();
        // Initialiser les achievements par défaut
        await AchievementService.initializeDefaultAchievements();
        console.log('\n✅ Achievements initialisés avec succès!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des achievements:', error);
        process.exit(1);
    }
}
initializeAchievements();
//# sourceMappingURL=initAchievements.js.map