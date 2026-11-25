const { readFileSync } = require('node:fs');
const { join } = require('node:path');

// Read only the protected roster used by the inference controller. A green
// workflow with a skipped plan (the former label policy) is not qualification.
module.exports = async function requireInferenceJobs(github, repo, run, prefix = '') {
  if (run.conclusion !== 'success') throw new Error(`Inference qualification: ${run.conclusion}`);
  const { models } = JSON.parse(readFileSync(join(__dirname, '../../ci/inference-ladder.json'), 'utf8'));
  const configurations = models.filter(model => model.pr).flatMap(model =>
    [model.id + '-standalone', ...(model.split ? [model.id + '-split'] : [])]);
  if (!configurations.length) throw new Error('Inference qualification: empty PR roster');
  const required = ['plan', 'summary', ...configurations.map(id => `qualification (${id})`)];
  // Partial reruns inherit successful jobs. Read this run's history and use
  // each job's latest execution, so an older success cannot mask a new skip.
  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun,
    { ...repo, run_id: run.id, filter: 'all', per_page: 100 });
  const latest = new Map();
  for (const job of jobs) {
    if (job.run_attempt > run.run_attempt) throw new Error('Inference qualification: run attempt changed');
    if (!latest.has(job.name) || latest.get(job.name).id < job.id) latest.set(job.name, job);
  }
  for (const name of required) {
    const job = latest.get(prefix + name);
    if (job?.status !== 'completed' || job.conclusion !== 'success') {
      throw new Error(`Inference qualification: ${name}: ${job?.conclusion || 'missing or incomplete'}`);
    }
  }
};
