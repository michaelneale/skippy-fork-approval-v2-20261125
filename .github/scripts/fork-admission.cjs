// Runs only from protected main after GitHub releases an approved fork workflow.
// Repository setting: approval_policy=all_external_contributors. Approval admits
// the code to native execution, not just to an isolated hosted build.
const { routes } = require('./pr-trigger-paths.cjs');

module.exports = async function admit({ github, context, core }) {
  const trigger = context.payload.workflow_run;
  // Fork pull_request runs cannot see base-repository vars, even after approval.
  const expected = '.github/workflows/ci.yml';
  const { data: run } = await github.rest.actions.getWorkflowRun({
    ...context.repo, run_id: trigger.id,
  });
  if (context.eventName !== 'workflow_run' || run.event !== 'pull_request' ||
      run.repository?.id !== context.payload.repository.id || run.path !== expected ||
      run.status !== 'completed' || run.conclusion !== 'success' ||
      run.head_sha !== trigger.head_sha || run.run_attempt !== trigger.run_attempt ||
      !/^[a-f0-9]{40}$/.test(run.head_sha) || !run.head_repository ||
      run.head_repository.id === run.repository.id) {
    throw new Error('Not a successful current fork CI run from the expected producer');
  }
  // Fork workflow_run payloads can have an empty pull_requests list.
  const pulls = await github.paginate(github.rest.pulls.list,
    { ...context.repo, state: 'open',
      head: `${run.head_repository.owner.login}:${run.head_branch}`, per_page: 100 });
  const candidate = pulls.find(pr => pr.state === 'open' && pr.head.sha === run.head_sha &&
    pr.head.repo?.id === run.head_repository.id && pr.head.ref === run.head_branch &&
    pr.base.repo?.id === run.repository.id);
  if (!candidate) throw new Error('Approved fork commit is not the current head of an open PR');
  const { data: pr } = await github.rest.pulls.get({ ...context.repo, pull_number: candidate.number });
  if (pr.state !== 'open' || pr.head.sha !== run.head_sha ||
      pr.head.repo?.id !== run.head_repository.id || pr.base.repo?.id !== run.repository.id) {
    throw new Error('Fork PR changed during admission');
  }
  const files = await github.paginate(github.rest.pulls.listFiles,
    { ...context.repo, pull_number: pr.number, per_page: 100 });
  if (files.length < pr.changed_files) throw new Error('Incomplete PR file list');
  const { data: current } = await github.rest.pulls.get({ ...context.repo, pull_number: pr.number });
  if (current.state !== 'open' || current.head.sha !== run.head_sha) throw new Error('Fork PR changed during admission');
  // Trust GitHub's approval policy, never a candidate artifact, output, job name
  // or claim that its own CI tested the code. Protected CI repeats selected work.
  core.setOutput('source', pr.head.sha);
  core.setOutput('number', String(pr.number));
  const selected = routes(files);
  core.setOutput('routes', JSON.stringify(selected));
  core.setOutput('ci', String(selected.automation || selected.code || selected.packages));
  core.setOutput('inference', String(selected.inference));
};
