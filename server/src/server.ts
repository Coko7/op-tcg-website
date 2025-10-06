import dotenv from 'dotenv';
import { initializeApp, closeApp } from './app.js';

// Charger les variables d'environnement
dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer(): Promise<void> {
  try {
    const app = await initializeApp();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌐 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 URL: http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📚 Documentation API disponible`);
      }
    });

    // Gestion propre de l'arrêt du serveur
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Signal ${signal} reçu, arrêt du serveur...`);

      server.close(async (err) => {
        if (err) {
          console.error('❌ Erreur lors de la fermeture du serveur:', err);
          process.exit(1);
        }

        try {
          await closeApp();
          console.log('👋 Serveur arrêté proprement');
          process.exit(0);
        } catch (error) {
          console.error('❌ Erreur lors de la fermeture:', error);
          process.exit(1);
        }
      });

      // Forcer l'arrêt si ça prend trop de temps
      setTimeout(() => {
        console.error('⏰ Timeout lors de l\'arrêt, fermeture forcée');
        process.exit(1);
      }, 10000);
    };

    // Écouter les signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Gestion des erreurs non interceptées
    process.on('uncaughtException', (error) => {
      console.error('❌ Exception non interceptée:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesse rejetée non gérée:', reason, 'at:', promise);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();