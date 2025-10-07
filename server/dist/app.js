import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Database } from './utils/database.js';
import { MigrationManager } from './utils/migrations.js';
import { VegapullImporter } from './scripts/import-vegapull-data.js';
import { BoosterModel } from './models/Booster.js';
// Routes
import authRoutes from './routes/auth.js';
import cardRoutes from './routes/cards.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';
const app = express();
// Trust proxy pour obtenir la vraie IP derrière Docker/reverse proxy
app.set('trust proxy', 1);
// Configuration CORS
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200
};
// Middlewares de sécurité
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 300 : 1000, // Augmenté à 300 pour gérer plusieurs utilisateurs
    message: {
        error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Utiliser l'IP réelle du client si disponible
    keyGenerator: (req) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
});
// Rate limiting plus strict pour l'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 50, // 100 tentatives en prod, 50 en dev
    message: {
        error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Middleware pour les logs en développement
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}
// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', cardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
// Route de santé
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// Route pour servir les fichiers statiques (images, etc.)
app.use('/images', express.static('public/images'));
app.use('/boosters', express.static('public/images/boosters'));
// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.originalUrl
    });
});
// Gestionnaire d'erreurs global
app.use((error, req, res, next) => {
    console.error('Erreur non gérée:', error);
    if (res.headersSent) {
        return next(error);
    }
    const status = error.status || error.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Erreur interne du serveur'
        : error.message || 'Erreur inconnue';
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
});
// Fonction d'initialisation
export const initializeApp = async () => {
    try {
        console.log('🚀 Initialisation de l\'application...');
        // Initialiser la base de données
        await Database.initialize();
        console.log('✅ Base de données initialisée');
        // Exécuter les migrations
        const migrationManager = new MigrationManager();
        await migrationManager.migrate();
        console.log('✅ Migrations terminées');
        // Vérifier si la base de données contient des boosters
        const boosterCount = await BoosterModel.count();
        console.log(`📊 Nombre de boosters dans la DB: ${boosterCount}`);
        // Si pas de boosters, tenter d'importer les données Vegapull
        if (boosterCount === 0) {
            console.log('📦 Aucun booster trouvé, tentative d\'importation Vegapull...');
            try {
                const importer = new VegapullImporter();
                await importer.importData();
                await importer.cleanup();
                console.log('✅ Importation Vegapull terminée avec succès');
            }
            catch (importError) {
                console.warn('⚠️ Impossible d\'importer les données Vegapull:', importError);
                console.warn('💡 Vous pouvez importer manuellement avec: npm run import-vegapull');
            }
        }
        console.log('🎉 Application initialisée avec succès');
        return app;
    }
    catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        throw error;
    }
};
// Fonction de fermeture propre
export const closeApp = async () => {
    try {
        console.log('🔄 Fermeture de l\'application...');
        await Database.close();
        console.log('✅ Application fermée proprement');
    }
    catch (error) {
        console.error('❌ Erreur lors de la fermeture:', error);
        throw error;
    }
};
export default app;
//# sourceMappingURL=app.js.map