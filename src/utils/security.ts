/**
 * Security utilities for frontend
 * Protection contre XSS, validation d'entrées, etc.
 */

/**
 * Sanitize string to prevent XSS attacks
 * Encode HTML special characters
 */
export function sanitizeHtml(input: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize user input (username, etc.)
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate username format
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Le nom d\'utilisateur est requis' };
  }

  const sanitized = sanitizeInput(username);

  if (sanitized.length < 3 || sanitized.length > 30) {
    return { valid: false, error: 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return { valid: false, error: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Le mot de passe est requis' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Le mot de passe ne peut pas dépasser 128 caractères' };
  }

  // Calculate password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return { valid: true, strength };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'L\'email est requis' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'L\'email est trop long' };
  }

  return { valid: true };
}

/**
 * Detect potential XSS in user input
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string; sanitized?: string } {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Protocole non autorisé' };
    }

    return { valid: true, sanitized: urlObj.toString() };
  } catch (error) {
    return { valid: false, error: 'URL invalide' };
  }
}

/**
 * Secure local storage wrapper with encryption-like obfuscation
 */
export const secureStorage = {
  setItem(key: string, value: string): void {
    try {
      // Simple obfuscation (not real encryption)
      const obfuscated = btoa(value);
      localStorage.setItem(key, obfuscated);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  getItem(key: string): string | null {
    try {
      const obfuscated = localStorage.getItem(key);
      if (!obfuscated) return null;
      return atob(obfuscated);
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
};

/**
 * Generate CSRF token (simple client-side token)
 */
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Rate limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Prevent clickjacking by checking if page is in iframe
 */
export function preventClickjacking(): void {
  if (window.self !== window.top) {
    // Page is in an iframe
    console.warn('Page détectée dans un iframe - possible tentative de clickjacking');
    // Optionally, you can break out of the iframe or show a warning
    // window.top.location = window.self.location;
  }
}

/**
 * Check if content looks suspicious
 */
export function isSuspiciousContent(content: string): boolean {
  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(content));
}
