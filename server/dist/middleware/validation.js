export const validateRegistration = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];
    // Validation du nom d'utilisateur
    if (!username || typeof username !== 'string') {
        errors.push('Le nom d\'utilisateur est requis');
    }
    else if (username.length < 3 || username.length > 30) {
        errors.push('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères');
    }
    else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
    }
    // Validation du mot de passe
    if (!password || typeof password !== 'string') {
        errors.push('Le mot de passe est requis');
    }
    else if (password.length < 6) {
        errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }
    else if (password.length > 128) {
        errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
    }
    if (errors.length > 0) {
        res.status(400).json({
            error: 'Données invalides',
            details: errors
        });
        return;
    }
    next();
};
export const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];
    if (!username || typeof username !== 'string') {
        errors.push('Le nom d\'utilisateur est requis');
    }
    if (!password || typeof password !== 'string') {
        errors.push('Le mot de passe est requis');
    }
    if (errors.length > 0) {
        res.status(400).json({
            error: 'Données invalides',
            details: errors
        });
        return;
    }
    next();
};
export const validateRefreshToken = (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
        res.status(400).json({
            error: 'Token de rafraîchissement requis'
        });
        return;
    }
    next();
};
export const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;
    if (page && (isNaN(Number(page)) || Number(page) < 1)) {
        res.status(400).json({
            error: 'Le numéro de page doit être un nombre entier positif'
        });
        return;
    }
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 5000)) {
        res.status(400).json({
            error: 'La limite doit être un nombre entier entre 1 et 5000'
        });
        return;
    }
    next();
};
//# sourceMappingURL=validation.js.map