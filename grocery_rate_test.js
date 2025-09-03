import http from 'k6/http';
import { group, check, sleep } from 'k6';

// Parametrization via env vars
const START_RATE = Number(__ENV.START_RATE || 10);      // RPS at start
const PEAK_RATE = Number(__ENV.PEAK_RATE || 100);       // target peak RPS
const PRE_VUS = Number(__ENV.PRE_VUS || 50);            // pre-allocated VUs pool
const MAX_VUS = Number(__ENV.MAX_VUS || 500);           // hard cap of VUs
const RAMP1 = __ENV.RAMP1 || '1m';
const HOLD = __ENV.HOLD || '2m';
const RAMPDOWN = __ENV.RAMPDOWN || '30s';

export const options = {
  scenarios: {
    web: {
      executor: 'ramping-arrival-rate',
      startRate: START_RATE,
      preAllocatedVUs: PRE_VUS,
      maxVUs: MAX_VUS,
      timeUnit: '1s',
      stages: [
        { duration: RAMP1, target: PEAK_RATE },
        { duration: HOLD, target: PEAK_RATE },
        { duration: RAMPDOWN, target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'], // <2% ошибок — иначе провал
    http_req_duration: ['p(95)<1200'], // 95% < 1.2s
  },
};

const BASE_URL = 'https://grocery.kravemart.com';

export default function () {
  group('homepage', () => {
    const res = http.get(`${BASE_URL}/`, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.7',
        'upgrade-insecure-requests': '1',
      },
      tags: { name: 'GET /' },
    });
    check(res, {
      'status is 200': (r) => r.status === 200,
      'html received': (r) => String(r.headers['Content-Type'] || '').includes('text/html'),
    });
  });
  sleep(1);
}

// Example distributed run (two processes on one host):
// Terminal A:
// START_RATE=20 PEAK_RATE=200 PRE_VUS=100 MAX_VUS=1000 RAMP1=2m HOLD=3m RAMPDOWN=1m \
//   k6 run --address localhost:6566 --execution-segment 0:50% grocery_rate_test.js
// Terminal B:
// START_RATE=20 PEAK_RATE=200 PRE_VUS=100 MAX_VUS=1000 RAMP1=2m HOLD=3m RAMPDOWN=1m \
//   k6 run --address localhost:6567 --execution-segment 50%:100% grocery_rate_test.js
