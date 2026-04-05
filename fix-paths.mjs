import fs from 'fs';
import path from 'path';

const WIKI = 'wiki';
const dirs = fs.readdirSync(WIKI, { withFileTypes: true }).filter(d => d.isDirectory());

let fixed = 0;

for (const dir of dirs) {
  const mdPath = path.join(WIKI, dir.name, `${dir.name}.md`);
  if (!fs.existsSync(mdPath)) continue;
  let content = fs.readFileSync(mdPath, 'utf-8');

  // Match the current frontmatter line (may span single or multi-line already)
  const fmMatch = content.match(/^(OpenClaw 源码路径:)(.*?)(\n(?=[^#\s-]|$))/ms);
  if (!fmMatch) continue;

  // Extract the value(s) - could be "path" or already array format
  const afterColon = fmMatch[2].trim();

  let paths = [];
  if (afterColon.startsWith('[')) {
    // Already array format
    const inner = afterColon.slice(1, -1);
    paths = inner.split(',').map(p => p.trim().replace(/^"|"$/g, '')).filter(p => p);
  } else if (afterColon.includes('\n  -')) {
    // Already YAML list
    paths = afterColon.split('\n').filter(l => l.includes('- ')).map(l => l.replace(/.*- "?/, '').replace(/"?\s*$/, '').trim()).filter(p => p);
  } else {
    // Single string, possibly comma-separated
    let raw = afterColon.replace(/^"/, '').replace(/"$/, '');
    raw = raw.replace(/\\~/g, '~').replace(/\\\*/g, '*').replace(/\\_/g, '_').replace(/\\\//g, '/');
    paths = raw.split(',').map(p => p.trim()).filter(p => p);
  }

  let newVal;
  if (paths.length <= 1) {
    newVal = ` "${paths[0] || ''}"`;
  } else {
    newVal = '\n' + paths.map(p => `  - "${p}"`).join('\n');
  }

  // Find old line precisely
  const lines = content.split('\n');
  let startIdx = -1, endIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('OpenClaw 源码路径:')) {
      startIdx = i;
      endIdx = i;
      // Check if next lines are continuation (YAML list items)
      while (endIdx + 1 < lines.length && lines[endIdx + 1].match(/^\s+- "/)) {
        endIdx++;
      }
      break;
    }
  }

  if (startIdx === -1) continue;

  let newLine;
  if (paths.length <= 1) {
    newLine = `OpenClaw 源码路径: "${paths[0] || ''}"`;
  } else {
    newLine = `OpenClaw 源码路径:\n${paths.map(p => `  - "${p}"`).join('\n')}`;
  }

  const oldBlock = lines.slice(startIdx, endIdx + 1).join('\n');
  if (oldBlock !== newLine) {
    lines.splice(startIdx, endIdx - startIdx + 1, newLine);
    content = lines.join('\n');
    fs.writeFileSync(mdPath, content);
    fixed++;
    console.log(`✓ ${dir.name}: [${paths.join(', ')}]`);
  }
}

console.log(`\nFixed ${fixed} files.`);
