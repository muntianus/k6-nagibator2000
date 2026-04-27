const test = require('node:test');
const assert = require('node:assert/strict');

const {
  composePolicies,
  explainPlan,
  migrateToV1Alpha1,
  validateDocument
} = require('../policy-specs.cjs');

test('validateDocument returns diagnostics for invalid document', () => {
  const invalidTrafficModel = {
    apiVersion: 'launchgate.dev/v1alpha1',
    kind: 'TrafficModel',
    metadata: { name: 'broken' },
    spec: { scenarios: [{ name: 'smoke', executor: 'ramping-vus', stages: [{ target: 10 }] }] }
  };

  const result = validateDocument(invalidTrafficModel);

  assert.equal(result.valid, false);
  assert.ok(result.diagnostics.some((line) => line.includes('duration')));
});

test('composePolicies applies project overrides over global defaults', () => {
  const globalPolicy = {
    apiVersion: 'launchgate.dev/v1alpha1',
    kind: 'SLOPolicy',
    metadata: { name: 'global' },
    spec: {
      defaults: {
        hard: { operator: '<=', value: 1000 },
        soft: { operator: '<=', value: 700 }
      },
      rules: []
    }
  };

  const projectPolicy = {
    apiVersion: 'launchgate.dev/v1alpha1',
    kind: 'SLOPolicy',
    metadata: { name: 'project' },
    spec: {
      defaults: {
        hard: { operator: '<=', value: 800 },
        soft: { operator: '<=', value: 600 }
      },
      rules: [{
        name: 'smoke-latency',
        metric: 'http_req_duration_p95',
        selector: { scenario: 'smoke' },
        thresholds: {
          hard: { operator: '<=', value: 750 },
          soft: { operator: '<=', value: 500 }
        }
      }]
    }
  };

  const composed = composePolicies(globalPolicy, projectPolicy);

  assert.equal(composed.metadata.name, 'global+project');
  assert.equal(composed.spec.defaults.hard.value, 800);
  assert.equal(composed.spec.rules.length, 1);
});

test('migrateToV1Alpha1 upgrades v1alpha0 SLO policy shape', () => {
  const legacy = {
    apiVersion: 'launchgate.dev/v1alpha0',
    kind: 'SLOPolicy',
    metadata: { name: 'legacy' },
    spec: {
      defaultThreshold: { operator: '<=', value: 1200 },
      rules: [{
        name: 'smoke-latency',
        metric: 'http_req_duration_p95',
        selector: { scenario: 'smoke' },
        threshold: { operator: '<=', value: 1000 }
      }]
    }
  };

  const migrated = migrateToV1Alpha1(legacy);

  assert.equal(migrated.apiVersion, 'launchgate.dev/v1alpha1');
  assert.equal(migrated.spec.defaults.hard.value, 1200);
  assert.equal(migrated.spec.rules[0].thresholds.hard.value, 1000);
});

test('explainPlan produces resolved checks per scenario', () => {
  const trafficModel = {
    apiVersion: 'launchgate.dev/v1alpha1',
    kind: 'TrafficModel',
    metadata: { name: 'tm' },
    spec: {
      defaultTags: { env: 'staging' },
      scenarios: [{
        name: 'smoke',
        executor: 'ramping-vus',
        tags: { flow: 'checkout' },
        stages: [{ duration: '30s', target: 5 }]
      }]
    }
  };

  const policy = {
    apiVersion: 'launchgate.dev/v1alpha1',
    kind: 'SLOPolicy',
    metadata: { name: 'policy' },
    spec: {
      defaults: {
        hard: { operator: '<=', value: 1000 },
        soft: { operator: '<=', value: 700 }
      },
      rules: [{
        name: 'latency',
        metric: 'http_req_duration_p95',
        selector: { scenario: 'smoke' },
        thresholds: {
          hard: { operator: '<=', value: 800 },
          soft: { operator: '<=', value: 500 }
        }
      }]
    }
  };

  const plan = explainPlan(trafficModel, policy);

  assert.equal(plan.checks.length, 1);
  assert.equal(plan.checks[0].stageCount, 1);
  assert.equal(plan.checks[0].hard.value, 800);
  assert.equal(plan.checks[0].scenarioTags.env, 'staging');
  assert.equal(plan.checks[0].scenarioTags.flow, 'checkout');
});
