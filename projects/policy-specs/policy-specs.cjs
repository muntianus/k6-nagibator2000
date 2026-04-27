#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const trafficModelSchema = require('./schemas/v1alpha1/traffic-model.schema.json');
const sloPolicySchema = require('./schemas/v1alpha1/slo-policy.schema.json');

const SCHEMA_VALIDATORS = buildValidators();

function buildValidators() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  return {
    TrafficModel: ajv.compile(trafficModelSchema),
    SLOPolicy: ajv.compile(sloPolicySchema)
  };
}

function parseSpecFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.yaml' || ext === '.yml') {
    throw new Error(
      `YAML input is not available in this runtime yet for '${filePath}'. ` +
      'TODO: wire a YAML parser dependency once package mirror allows it.'
    );
  }

  return JSON.parse(raw);
}

function formatAjvErrors(errors = []) {
  return errors.map((error) => {
    const pointer = error.instancePath || error.dataPath || '/';
    const normalized = pointer.endsWith('/') ? pointer.slice(0, -1) : pointer;
    const field = error.params && error.params.missingProperty
      ? `${normalized}/${error.params.missingProperty}`
      : normalized;
    return `[${field}] ${error.message}`;
  });
}

function validateDocument(document, fileLabel = 'document') {
  const validator = SCHEMA_VALIDATORS[document.kind];
  if (!validator) {
    return {
      valid: false,
      diagnostics: [`[${fileLabel}] unsupported kind '${document.kind}'.`]
    };
  }

  const valid = validator(document);
  if (valid) {
    return { valid: true, diagnostics: [] };
  }

  return {
    valid: false,
    diagnostics: formatAjvErrors(validator.errors)
  };
}

function deepMerge(baseValue, overrideValue) {
  if (Array.isArray(baseValue) || Array.isArray(overrideValue)) {
    return overrideValue !== undefined ? overrideValue : baseValue;
  }

  if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
    const merged = { ...baseValue };
    for (const key of Object.keys(overrideValue)) {
      merged[key] = deepMerge(baseValue[key], overrideValue[key]);
    }
    return merged;
  }

  return overrideValue !== undefined ? overrideValue : baseValue;
}

function composePolicies(globalPolicy, projectOverride) {
  if (globalPolicy.kind !== 'SLOPolicy' || projectOverride.kind !== 'SLOPolicy') {
    throw new Error('Policy composition only supports SLOPolicy documents.');
  }

  const mergedSpec = deepMerge(globalPolicy.spec, projectOverride.spec);

  return {
    ...globalPolicy,
    metadata: {
      ...globalPolicy.metadata,
      ...projectOverride.metadata,
      name: `${globalPolicy.metadata.name}+${projectOverride.metadata.name}`
    },
    spec: mergedSpec
  };
}

function migrateToV1Alpha1(document) {
  if (document.apiVersion === 'launchgate.dev/v1alpha1') {
    return document;
  }

  if (document.apiVersion !== 'launchgate.dev/v1alpha0') {
    throw new Error(`Unsupported source apiVersion '${document.apiVersion}'.`);
  }

  if (document.kind !== 'SLOPolicy') {
    throw new Error(`Migration path for kind '${document.kind}' is not implemented.`);
  }

  const migratedRules = (document.spec.rules || []).map((rule) => {
    if (!rule.threshold) {
      return rule;
    }

    return {
      ...rule,
      thresholds: {
        hard: rule.threshold,
        soft: rule.threshold
      }
    };
  });

  return {
    ...document,
    apiVersion: 'launchgate.dev/v1alpha1',
    spec: {
      defaults: {
        hard: document.spec.defaultThreshold,
        soft: document.spec.defaultThreshold
      },
      rules: migratedRules.map((rule) => {
        const clonedRule = { ...rule };
        delete clonedRule.threshold;
        return clonedRule;
      })
    }
  };
}

function explainPlan(trafficModel, sloPolicy) {
  const checks = [];
  const defaults = sloPolicy.spec.defaults;

  for (const scenario of trafficModel.spec.scenarios) {
    const scenarioRules = sloPolicy.spec.rules.filter(
      (rule) => rule.selector.scenario === scenario.name
    );

    for (const rule of scenarioRules) {
      const resolvedThresholds = deepMerge(defaults, rule.thresholds);
      checks.push({
        scenario: scenario.name,
        metric: rule.metric,
        hard: resolvedThresholds.hard,
        soft: resolvedThresholds.soft,
        stageCount: scenario.stages.length,
        scenarioTags: deepMerge(trafficModel.spec.defaultTags || {}, scenario.tags || {})
      });
    }
  }

  return {
    policy: sloPolicy.metadata.name,
    checks
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function printUsage() {
  console.log(`Usage:
  node projects/policy-specs/policy-specs.cjs validate <spec-file>
  node projects/policy-specs/policy-specs.cjs compose <global-policy> <project-policy>
  node projects/policy-specs/policy-specs.cjs migrate <input-spec>
  node projects/policy-specs/policy-specs.cjs explain <traffic-model> <slo-policy>`);
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function runCli(args) {
  const [command, ...rest] = args;

  if (!command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (command === 'validate') {
    const [filePath] = rest;
    const doc = parseSpecFile(filePath);
    const result = validateDocument(doc, filePath);
    if (!result.valid) {
      console.error(result.diagnostics.join('\n'));
      process.exitCode = 1;
      return;
    }
    console.log(`OK: ${filePath}`);
    return;
  }

  if (command === 'compose') {
    const [globalPath, projectPath] = rest;
    const globalDoc = parseSpecFile(globalPath);
    const projectDoc = parseSpecFile(projectPath);
    printJson(composePolicies(globalDoc, projectDoc));
    return;
  }

  if (command === 'migrate') {
    const [filePath] = rest;
    const doc = parseSpecFile(filePath);
    printJson(migrateToV1Alpha1(doc));
    return;
  }

  if (command === 'explain') {
    const [trafficPath, policyPath] = rest;
    const trafficDoc = parseSpecFile(trafficPath);
    const policyDoc = parseSpecFile(policyPath);
    printJson(explainPlan(trafficDoc, policyDoc));
    return;
  }

  printUsage();
  process.exitCode = 1;
}

if (require.main === module) {
  runCli(process.argv.slice(2));
}

module.exports = {
  composePolicies,
  explainPlan,
  migrateToV1Alpha1,
  parseSpecFile,
  validateDocument,
  deepMerge,
  formatAjvErrors
};
