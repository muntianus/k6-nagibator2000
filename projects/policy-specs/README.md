# Policy Specs Service Stub (v1alpha1)

This stub defines versioned specs for Launch Gate policy behavior:

- `TrafficModel` schema (scenarios, stages, and tags)
- `SLOPolicy` schema (hard/soft thresholds)
- Validation with actionable diagnostics
- Policy composition (`global defaults + project overrides`)
- Schema migration helper (`v1alpha0 -> v1alpha1`)
- Dry-run explain plan for policy debugging

## Files

- `schemas/v1alpha1/traffic-model.schema.json`
- `schemas/v1alpha1/slo-policy.schema.json`
- `policy-specs.cjs` CLI and core helpers
- `examples/*.json` sample documents

## Usage

```bash
node projects/policy-specs/policy-specs.cjs validate projects/policy-specs/examples/traffic-model.json
node projects/policy-specs/policy-specs.cjs compose projects/policy-specs/examples/slo-global.json projects/policy-specs/examples/slo-project-override.json
node projects/policy-specs/policy-specs.cjs migrate projects/policy-specs/examples/slo-v1alpha0.json
node projects/policy-specs/policy-specs.cjs explain projects/policy-specs/examples/traffic-model.json projects/policy-specs/examples/slo-global.json
```

## Notes

- YAML files are included as API-facing examples, but CLI parsing currently runs on JSON only.
- TODO: enable YAML parsing once package mirror allows the dependency installation.
- Composition currently replaces arrays from override policy by design to keep precedence deterministic.
