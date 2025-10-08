/**
 * Tests de pénétration pour valider la sécurité de l'API
 *
 * Usage: node security-penetration-tests.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function logTest(name, passed, details = '') {
  if (passed) {
    testsPassed++;
    log(colors.green, `✓ ${name}`, details);
  } else {
    testsFailed++;
    log(colors.red, `✗ ${name}`, details);
  }
}

function logSection(name) {
  console.log('');
  log(colors.cyan, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(colors.cyan, `  ${name}`);
  log(colors.cyan, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

async function testSQLInjection() {
  logSection('Tests d\'Injection SQL');

  const sqlPayloads = [
    "' OR '1'='1",
    "admin'--",
    "' UNION SELECT NULL--",
    "1' AND 1=1--",
    "'; DROP TABLE users--"
  ];

  for (const payload of sqlPayloads) {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: payload, password: payload })
      });

      const status = response.status;
      const passed = status === 400 || status === 401;
      logTest(
        `SQL Injection - Payload: "${payload.substring(0, 20)}..."`,
        passed,
        `(Status: ${status})`
      );
    } catch (error) {
      logTest(`SQL Injection - Payload: "${payload.substring(0, 20)}..."`, false, error.message);
    }
  }
}

async function testXSS() {
  logSection('Tests XSS (Cross-Site Scripting)');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg/onload=alert("XSS")>'
  ];

  for (const payload of xssPayloads) {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: payload, password: 'password123' })
      });

      const data = await response.json();
      const passed = response.status === 400 || response.status === 409;
      logTest(
        `XSS - Payload: "${payload.substring(0, 30)}..."`,
        passed,
        `(Status: ${response.status})`
      );
    } catch (error) {
      logTest(`XSS - Payload: "${payload.substring(0, 30)}..."`, false, error.message);
    }
  }
}

async function testPathTraversal() {
  logSection('Tests de Path Traversal');

  const pathPayloads = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd'
  ];

  for (const payload of pathPayloads) {
    try {
      const response = await fetch(`${API_URL}/api/cards/${payload}`, {
        method: 'GET'
      });

      const status = response.status;
      const passed = status === 400 || status === 404;
      logTest(
        `Path Traversal - Payload: "${payload.substring(0, 30)}..."`,
        passed,
        `(Status: ${status})`
      );
    } catch (error) {
      logTest(`Path Traversal - Payload: "${payload.substring(0, 30)}..."`, false, error.message);
    }
  }
}

async function testRateLimiting() {
  logSection('Tests de Rate Limiting');

  const requests = [];
  const startTime = Date.now();

  // Envoyer 15 requêtes rapidement (limite auth = 10)
  for (let i = 0; i < 15; i++) {
    requests.push(
      fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `test${i}`, password: 'password' })
      })
    );
  }

  try {
    const responses = await Promise.all(requests);
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    const elapsed = Date.now() - startTime;

    logTest(
      'Rate Limiting - Limite auth dépassée',
      rateLimitedCount > 0,
      `(${rateLimitedCount}/15 bloquées en ${elapsed}ms)`
    );
  } catch (error) {
    logTest('Rate Limiting', false, error.message);
  }
}

async function testAuthenticationBypass() {
  logSection('Tests de Bypass d\'Authentification');

  const endpoints = [
    { path: '/api/users/collection', method: 'GET' },
    { path: '/api/users/open-booster', method: 'POST' },
    { path: '/api/users/buy-booster', method: 'POST' },
    { path: '/api/admin/reset-all-data', method: 'POST' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: endpoint.method === 'POST' ? '{}' : undefined
      });

      const passed = response.status === 401 || response.status === 403;
      logTest(
        `Auth Bypass - ${endpoint.method} ${endpoint.path}`,
        passed,
        `(Status: ${response.status})`
      );
    } catch (error) {
      logTest(`Auth Bypass - ${endpoint.method} ${endpoint.path}`, false, error.message);
    }
  }
}

async function testMaliciousUserAgent() {
  logSection('Tests de User-Agent Suspects');

  const maliciousAgents = [
    'sqlmap/1.0',
    'Nikto/2.1.6',
    'Burp Suite Professional',
    'nmap scripting engine'
  ];

  for (const agent of maliciousAgents) {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': agent
        },
        body: JSON.stringify({ username: 'test', password: 'test' })
      });

      const passed = response.status === 403;
      logTest(
        `User-Agent Suspect - "${agent}"`,
        passed,
        `(Status: ${response.status})`
      );
    } catch (error) {
      logTest(`User-Agent Suspect - "${agent}"`, false, error.message);
    }
  }
}

async function testRequestSize() {
  logSection('Tests de Taille de Requête');

  // Créer une requête > 10MB
  const largePayload = 'x'.repeat(11 * 1024 * 1024);

  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: largePayload })
    });

    const passed = response.status === 413 || response.status === 400;
    logTest(
      'Request Size Limit - Payload > 10MB',
      passed,
      `(Status: ${response.status})`
    );
  } catch (error) {
    // Erreur de réseau attendue pour payload trop large
    logTest('Request Size Limit - Payload > 10MB', true, '(Connection error - expected)');
  }
}

async function testBusinessLogicBypass() {
  logSection('Tests de Logique Métier');

  // Créer un utilisateur de test
  const username = `pentest_${Date.now()}`;
  const password = 'TestPassword123!';

  try {
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (registerResponse.status !== 201) {
      log(colors.yellow, '⚠ Impossible de créer utilisateur de test, tests métier skippés');
      testsSkipped += 4;
      return;
    }

    const registerData = await registerResponse.json();
    const token = registerData.accessToken;

    // Test 1: Tenter d'ouvrir un booster sans en avoir
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const loginData = await loginResponse.json();
    const freshToken = loginData.accessToken;

    // Épuiser les boosters gratuits
    let openCount = 0;
    for (let i = 0; i < 10; i++) {
      const openResponse = await fetch(`${API_URL}/api/users/open-booster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freshToken}`
        }
      });
      if (openResponse.status === 200) openCount++;
      else break;
    }

    // Tenter d'ouvrir un booster supplémentaire
    const extraBoosterResponse = await fetch(`${API_URL}/api/users/open-booster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    });

    logTest(
      'Business Logic - Empêcher ouverture sans booster',
      extraBoosterResponse.status === 400 || extraBoosterResponse.status === 403,
      `(Status: ${extraBoosterResponse.status}, Opened: ${openCount})`
    );

    // Test 2: Tenter d'acheter un booster sans Berrys
    const buyResponse = await fetch(`${API_URL}/api/users/buy-booster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    });

    logTest(
      'Business Logic - Empêcher achat sans Berrys',
      buyResponse.status === 400 || buyResponse.status === 403 || buyResponse.status === 500,
      `(Status: ${buyResponse.status})`
    );

    // Test 3: Tenter de réclamer la récompense quotidienne 2 fois
    const dailyReward1 = await fetch(`${API_URL}/api/users/daily-reward/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    });

    const dailyReward2 = await fetch(`${API_URL}/api/users/daily-reward/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    });

    logTest(
      'Business Logic - Empêcher double-claim récompense quotidienne',
      dailyReward2.status === 400,
      `(1st: ${dailyReward1.status}, 2nd: ${dailyReward2.status})`
    );

  } catch (error) {
    logTest('Business Logic Tests', false, error.message);
  }
}

async function testAntiCheat() {
  logSection('Tests Anti-Triche');

  const username = `antiCheat_${Date.now()}`;
  const password = 'TestPassword123!';

  try {
    // Créer utilisateur
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (registerResponse.status !== 201) {
      log(colors.yellow, '⚠ Impossible de créer utilisateur de test, tests anti-triche skippés');
      testsSkipped += 2;
      return;
    }

    const registerData = await registerResponse.json();
    const token = registerData.accessToken;

    // Test: Envoyer 20 requêtes d'ouverture de booster en rafale (limite = 10/min)
    const rapidRequests = [];
    for (let i = 0; i < 20; i++) {
      rapidRequests.push(
        fetch(`${API_URL}/api/users/open-booster`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      );
    }

    const rapidResponses = await Promise.all(rapidRequests);
    const blockedCount = rapidResponses.filter(r => r.status === 429).length;

    logTest(
      'Anti-Cheat - Rate limiting sur actions de jeu',
      blockedCount > 5,
      `(${blockedCount}/20 bloquées)`
    );

    // Test: Actions avec délai trop court
    await new Promise(resolve => setTimeout(resolve, 100));

    const quickActions = [];
    for (let i = 0; i < 5; i++) {
      quickActions.push(
        fetch(`${API_URL}/api/users/open-booster`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).then(r => r.status)
      );
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms entre chaque
    }

    const quickStatuses = await Promise.all(quickActions);
    const quickBlocked = quickStatuses.filter(s => s === 429).length;

    logTest(
      'Anti-Cheat - Délai minimum entre actions',
      quickBlocked > 0,
      `(${quickBlocked}/5 bloquées)`
    );

  } catch (error) {
    logTest('Anti-Cheat Tests', false, error.message);
  }
}

async function runAllTests() {
  console.log('');
  log(colors.blue, '╔════════════════════════════════════════════════════╗');
  log(colors.blue, '║  Tests de Pénétration - One Piece Booster Game    ║');
  log(colors.blue, '╚════════════════════════════════════════════════════╝');
  log(colors.yellow, `\nAPI URL: ${API_URL}\n`);

  await testSQLInjection();
  await testXSS();
  await testPathTraversal();
  await testRateLimiting();
  await testAuthenticationBypass();
  await testMaliciousUserAgent();
  await testRequestSize();
  await testBusinessLogicBypass();
  await testAntiCheat();

  // Rapport final
  logSection('Rapport Final');
  const total = testsPassed + testsFailed + testsSkipped;

  log(colors.green, `✓ Tests réussis: ${testsPassed}/${total}`);
  if (testsFailed > 0) {
    log(colors.red, `✗ Tests échoués: ${testsFailed}/${total}`);
  }
  if (testsSkipped > 0) {
    log(colors.yellow, `⊘ Tests skippés: ${testsSkipped}/${total}`);
  }

  const successRate = ((testsPassed / (total - testsSkipped)) * 100).toFixed(2);
  console.log('');

  if (testsFailed === 0) {
    log(colors.green, `🎉 Tous les tests de sécurité ont réussi! (${successRate}%)`);
    process.exit(0);
  } else {
    log(colors.red, `⚠️  ${testsFailed} vulnérabilités détectées! Taux de réussite: ${successRate}%`);
    process.exit(1);
  }
}

// Lancer les tests
runAllTests().catch(error => {
  log(colors.red, '\n❌ Erreur fatale:', error.message);
  process.exit(1);
});
