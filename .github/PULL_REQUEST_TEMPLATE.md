<!-- Use a clear PR title describing the resulting capability or fix.
Replace prompts with concrete details. Remove optional sections that do not
apply. Keep this description aligned with the final diff. -->

## Original problem

What was broken, missing, confusing, or risky? Explain the effect on users or
maintainers and what they can now do after this change.

Link related issues, PRs, or failing runs when available (for example,
`Closes #123`). An issue is not required.

## Diagnostics

How did you establish the cause? Include reproduction steps, commands,
representative errors, logs, or links to evidence as appropriate.

## Fix

Explain the resulting behavior and how the change addresses the cause.

## Usage (if applicable)

For CLI changes, show example commands and representative output. For API
changes, show affected usage. Label illustrative output; include screenshots
for visual changes when relevant.

## Architecture (if applicable)

Explain material architecture changes and why they are needed.

## Compatibility (if applicable)

Describe ABI, API, wire/hash, model/runtime, or artifact compatibility impact
and any required migration.

## Workflow diagrams (required for GitHub Actions changes)

For each affected workflow, add labeled **Before** and **After** Mermaid diagrams
comparing the target branch with the final proposed change. Show changed triggers,
job dependencies, artifact handoffs, and qualification or publication gates.
Include shared composite action diagrams when their execution flow changes.
Remove this section only when the PR changes neither Actions workflows nor
shared composite actions.

## Validation

List exact commands, relevant configuration/features, and observed results.
Identify failed, pending, or unrun checks and explain gaps. Link logs or
artifacts when useful. State whether model or hardware qualification ran when
relevant; missing fixtures or devices are not passing qualification.

For performance claims, include baseline and changed results, workload, model,
hardware/backend, and evidence. Label estimates explicitly.

## Acceptance criteria

<!-- Required by PR checks: retain both standard criteria and check each only
when satisfied. Additional criteria in this section must also be checked.
Record validation evidence or explain why checks do not apply above. -->

- [ ] I ran the relevant local checks, or explained why they do not apply.
- [ ] I agree to license my contributions under the Apache License, Version 2.0.
