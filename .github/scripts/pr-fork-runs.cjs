const { routes } = require('./pr-trigger-paths.cjs');
const requireInferenceJobs = require('./pr-inference-checks.cjs');

function source(run) {
  if (run?.event !== 'workflow_run' || run.path?.split('@')[0] !== '.github/workflows/fork-native.yml') return null;
  return /^([a-f0-9]{40})$/.exec(run.display_title || '')?.[1] || null;
}

async function requireForkJobs(github, repo, run, files) {
  if (run.conclusion !== 'success') throw new Error(`Approved fork CI: ${run.conclusion}`);
  const selected = routes(files);
  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun,
    { ...repo, run_id: run.id, filter: 'all', per_page: 100 });
  const latest = new Map();
  for (const job of jobs) {
    if (job.run_attempt > run.run_attempt) throw new Error('Approved fork CI: run attempt changed');
    if (!latest.has(job.name) || latest.get(job.name).id < job.id) latest.set(job.name, job);
  }
  const required = ['admission'];
  if (selected.automation || selected.code || selected.packages) required.push('ci / CI');
  for (const name of required) {
    const job = latest.get(name);
    if (job?.status !== 'completed' || job.conclusion !== 'success') {
      throw new Error(`Approved fork CI: ${name}: ${job?.conclusion || 'missing or incomplete'}`);
    }
  }
  if (selected.inference) await requireInferenceJobs(github, repo, run, 'inference / ');
}

module.exports = { source, requireForkJobs };
