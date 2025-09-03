import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 2500 },
    { duration: '1m', target: 5000 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  http.get('http://alphwu.cfd');
}