import http from 'k6/http';
import { group, check, sleep } from 'k6';

// k6 options
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<800'], // 95% < 800ms
  },
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 30 },
    { duration: '30s', target: 0 },
  ],
};

const BASE_URL = 'https://grocery.kravemart.com';

export default function () {
  group('homepage', () => {
    const res = http.get(`${BASE_URL}/`, {
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.7',
        'upgrade-insecure-requests': '1',
      },
      tags: { name: 'GET /' },
    });

    check(res, {
      'status is 200': (r) => r.status === 200,
      'html received': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('text/html'),
    });
  });

  // small pacing to avoid hot looping
  sleep(1);
}

// Tip: override stages at runtime if needed
// k6 run -e STAGES="[{duration:'10s',target:5},{duration:'20s',target:5},{duration:'10s',target:0}]" grocery_load_test.js
