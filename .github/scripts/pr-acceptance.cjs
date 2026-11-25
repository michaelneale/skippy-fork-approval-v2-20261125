const { readFileSync } = require('node:fs');
const { join } = require('node:path');

// Read only the protected checkout's template, never a candidate file.
const template = readFileSync(join(__dirname, '../PULL_REQUEST_TEMPLATE.md'), 'utf8');

function criteria(body) {
  const lines = (body || '').split(/\r?\n/);
  const tasks = [];
  let sections = 0, inside = false, fence = null;
  let comment = false;
  let listIndents = [];
  for (let line of lines) {
    if (fence) {
      const close = line.match(/^ {0,3}(`+|~+)\s*$/);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
      continue;
    }
    let visible = '';
    while (line) {
      const delimiter = comment ? '-->' : '<!--';
      const index = line.indexOf(delimiter);
      if (index < 0) { if (!comment) visible += line; break; }
      if (!comment) visible += line.slice(0, index);
      line = line.slice(index + delimiter.length);
      comment = !comment;
    }
    line = visible;
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (opening) { fence = opening[1]; continue; }
    if (/^ {0,3}>/.test(line)) continue;
    const heading = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading && heading[1].length <= 2) {
      inside = heading[1] === '##' && /^acceptance criteria$/i.test(heading[2]);
      listIndents = [];
      if (inside) sections++;
      continue;
    }
    if (!inside) continue;
    const item = line.match(/^( *)([-+*]|\d+[.)])\s+(.*)$/);
    if (!item) {
      if (/^\S/.test(line)) listIndents = [];
      continue;
    }
    const indent = item[1].length;
    listIndents = listIndents.filter(parent => parent.indent < indent);
    const parent = listIndents.at(-1);
    // Four spaces beyond a parent's content (or the document) starts code.
    if (indent >= (parent?.content || 0) + 4) continue;
    listIndents.push({ indent, content: indent + item[2].length + 1 });
    const task = item[3].match(/^\[([^\]]*)\]\s*(.*)$/);
    if (task) tasks.push({ checked: /^[xX]$/.test(task[1]), text: task[2].trim().replace(/\s+/g, ' ') });
  }
  if (sections !== 1) throw new Error('Acceptance criteria: exactly one ## Acceptance criteria section is required');
  if (!tasks.length) throw new Error('Acceptance criteria: checklist is empty');
  return tasks;
}

module.exports = function validateAcceptance(body) {
  const tasks = criteria(body);
  for (const required of criteria(template)) {
    if (!tasks.some(task => task.text === required.text)) {
      throw new Error(`Acceptance criteria missing: ${required.text}`);
    }
  }
  for (const task of tasks) {
    if (!task.checked || !task.text) {
      throw new Error(`Acceptance criteria incomplete: ${task.text || '(empty task)'}`);
    }
  }
};
