import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time', true);
export let successfulRequests = new Counter('successful_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate threshold
    response_time: ['p(95)<400'],     // 95% of custom response times below 400ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://httpbin.org';

export default function () {
  group('API Health Check', function () {
    const response = http.get(`${BASE_URL}/status/200`);
    
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
    responseTime.add(response.timings.duration);
    
    if (success) {
      successfulRequests.add(1);
    }
  });

  group('Data Operations', function () {
    // POST request
    const postData = { name: 'Test User', email: 'test@example.com' };
    const postResponse = http.post(`${BASE_URL}/post`, JSON.stringify(postData), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(postResponse, {
      'POST status is 200': (r) => r.status === 200,
      'POST response contains data': (r) => r.json().json !== undefined,
    });

    // GET request with parameters
    const getResponse = http.get(`${BASE_URL}/get?param1=value1&param2=value2`);
    
    check(getResponse, {
      'GET status is 200': (r) => r.status === 200,
      'GET response has args': (r) => Object.keys(r.json().args).length > 0,
    });
  });

  group('Authentication Simulation', function () {
    const authResponse = http.get(`${BASE_URL}/basic-auth/user/pass`, {
      auth: 'basic',
      username: 'user',
      password: 'pass',
    });
    
    check(authResponse, {
      'auth status is 200': (r) => r.status === 200,
      'authenticated response': (r) => r.json().authenticated === true,
    });
  });

  // Random sleep between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    'summary.html': htmlReport(data),
    'summary.json': JSON.stringify(data, null, 2),
  };
}

function htmlReport(data) {
  const successRate = ((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2);
  const avgResponseTime = data.metrics.http_req_duration.values.avg.toFixed(2);
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>K6 Advanced Load Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007acc; }
        .metric-title { font-weight: bold; color: #333; margin-bottom: 10px; }
        .metric-value { font-size: 24px; color: #007acc; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 K6 Advanced Load Test Results</h1>
        <p>Advanced performance testing with custom metrics and thresholds</p>
    </div>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-title">📊 Success Rate</div>
            <div class="metric-value">${successRate}%</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">⏱️ Avg Response Time</div>
            <div class="metric-value">${avgResponseTime}ms</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">🔥 Total Requests</div>
            <div class="metric-value">${data.metrics.http_reqs.values.count}</div>
        </div>
        <div class="metric-card">
            <div class="metric-title">👥 Max VUs</div>
            <div class="metric-value">${data.metrics.vus_max.values.max}</div>
        </div>
    </div>
    
    <h2>📈 Key Metrics</h2>
    <ul>
        <li><strong>P95 Response Time:</strong> ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms</li>
        <li><strong>P99 Response Time:</strong> ${data.metrics.http_req_duration.values.p99.toFixed(2)}ms</li>
        <li><strong>Error Rate:</strong> ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%</li>
        <li><strong>Data Received:</strong> ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB</li>
    </ul>
</body>
</html>
  `;
}