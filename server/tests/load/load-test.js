const autocannon = require('autocannon');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

async function getAuthToken() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'tushar@example.com',
      password: 'password123',
    });

    const parsedUrl = new URL(BASE_URL);

    const req = http.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.success && parsed.data?.token) {
              resolve(parsed.data.token);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      }
    );

    req.on('error', () => resolve(null));
    req.write(postData);
    req.end();
  });
}

function runAutocannon(opts) {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function main() {
  console.log(`🌿 Starting LeafPulse Load & Concurrency Testing on ${BASE_URL}...`);
  const token = await getAuthToken();
  if (token) {
    console.log('✓ Acquired JWT auth token successfully.');
  } else {
    console.log('ℹ Auth token skipped (running in unauthenticated/mock health mode).');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const requests = [
    { method: 'GET', path: '/api/health', weight: 2 },
    {
      method: 'POST',
      path: '/api/auth/login',
      weight: 2,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tushar@example.com', password: 'password123' }),
    },
    { method: 'GET', path: '/api/plants', headers, weight: 3 },
    { method: 'GET', path: '/api/dashboard', headers, weight: 3 },
    {
      method: 'POST',
      path: '/api/logs',
      headers,
      weight: 2,
      body: JSON.stringify({
        plant_id: 1,
        action: 'Watered',
        date: new Date().toISOString().split('T')[0],
        notes: 'Automated load test log',
      }),
    },
  ];

  const concurrencyLevels = [10, 50, 100, 250, 500, 1000];
  const results = [];

  for (const c of concurrencyLevels) {
    console.log(`\n--- Testing ${c} Concurrent Connections (30s) ---`);
    try {
      const res = await runAutocannon({
        url: BASE_URL,
        connections: c,
        duration: 30,
        requests,
      });

      const rps = (res.requests.total / res.duration).toFixed(1);
      console.log(`Connections: ${c} | Total: ${res.requests.total} | RPS: ${rps} | Avg: ${res.latency.average}ms | p95: ${res.latency.p95}ms | p99: ${res.latency.p99}ms | Errors: ${res.errors} | Timeouts: ${res.timeouts}`);

      results.push({
        connections: c,
        total: res.requests.total,
        rps,
        avgLatency: res.latency.average,
        p95: res.latency.p95,
        p99: res.latency.p99,
        errors: res.errors,
        timeouts: res.timeouts,
      });
    } catch (e) {
      console.error(`Failed at concurrency ${c}:`, e.message);
      break;
    }
  }

  console.log('\n✓ Ramp-up load testing run complete.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, runAutocannon };
