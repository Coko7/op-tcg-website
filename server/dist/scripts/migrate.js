import { Database } from '../utils/database.js';
import { MigrationManager } from '../utils/migrations.js';
async function runMigrations() {
    try {
        console.log('🚀 Démarrage des migrations...\n');
        // Initialiser la base de données
        await Database.initialize();
        // Créer et exécuter les migrations
        const migrationManager = new MigrationManager();
        // Afficher le statut
        await migrationManager.getStatus();
        // Exécuter les migrations
        await migrationManager.migrate();
        console.log('\n✅ Migrations terminées avec succès!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erreur lors des migrations:', error);
        process.exit(1);
    }
}
runMigrations();
//# sourceMappingURL=migrate.js.map