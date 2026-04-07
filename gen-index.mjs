import fs from 'fs';
import path from 'path';

fs.mkdirSync('public', { recursive: true });

// ─── Shared helpers ────────────────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const meta = {};
  const lines = match[1].split('\n');
  let currentKey = null;

  for (const line of lines) {
    if (/^\s+- /.test(line) && currentKey) {
      const val = line.trim().replace(/^- "?\s*/, '').replace(/\s*"?\s*$/, '');
      if (Array.isArray(meta[currentKey])) meta[currentKey].push(val);
      continue;
    }
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();

    if (val === '') { meta[key] = []; currentKey = key; continue; }

    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).trim();

    if (val.includes(',') && !val.includes('，') && !val.startsWith('[')) {
      const parts = val.split(',').map(p => p.trim().replace(/^"|"$/g, '')).filter(p => p);
      if (parts.length > 1) { meta[key] = parts; currentKey = null; continue; }
    }

    meta[key] = val;
    currentKey = null;
  }
  return meta;
}

function extractTitle(content) {
  const m = content.match(/^---[\s\S]*?---\s*\n*#\s+(.+)$/m);
  return m ? m[1].replace(/&#x20;/g, '').trim() : '';
}

function normalizeArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [];
}

function splitCommaField(val) {
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string' || !val.trim()) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
// Part 1: OpenClaw Threat Model
// ═══════════════════════════════════════════════════════════════
function generateOpenClawIndex() {
  const DIR = 'wiki/openclaw-threat-model';
  const OUTPUT = 'public/wiki-index-openclaw.json';

  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
  const threats = [];
  const cliCommands = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(DIR, file), 'utf-8');
    const meta = parseFrontmatter(content);
    if (!meta) continue;

    const id = meta['序号'] || '';
    const isThreat = /^[A-Z]+-\d+$/.test(id);
    const name = file.replace(/\.md$/, '');

    const entry = {
      folder: name,
      title: extractTitle(content) || name,
      layer: meta['层级'] || '',
      severity: meta['威胁等级'] || '',
      id,
      sourcePaths: normalizeArray(meta['OpenClaw 源码路径'] || meta['OpenClaw源码路径'] || ''),
      layerDescription: meta['层级说明'] || '',
    };

    if (isThreat) threats.push(entry);
    else cliCommands.push(entry);
  }

  threats.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(OUTPUT, JSON.stringify({ threats, cliCommands }, null, 2) + '\n');
  console.log(`Generated ${OUTPUT}: Threats=${threats.length} CLI=${cliCommands.length}`);
}

// ═══════════════════════════════════════════════════════════════
// Part 2: AI Agent Threat Model
// ═══════════════════════════════════════════════════════════════

// Hard-coded category metadata
const CATEGORY_MAP = {
  '源于智能体自主性与推理能力的威胁': { id: 'autonomy', color: '#f472b6', icon: '🧠' },
  '基于记忆的威胁': { id: 'memory', color: '#a78bfa', icon: '💾' },
  '基于工具、执行过程与供应链的威胁': { id: 'tool', color: '#fb923c', icon: '🔧' },
  '基于身份验证与仿冒的威胁': { id: 'identity', color: '#60a5fa', icon: '🔐' },
  '与人类相关的威胁': { id: 'human', color: '#facc15', icon: '👤' },
  '多智能体系统威胁': { id: 'multi-agent', color: '#f43f5e', icon: '🌐' },
};

function generateAIAgentIndex() {
  const THREAT_DIR = 'wiki/ai-agent-threat-model/theat-database';
  const PLAYBOOK_DIR = 'wiki/ai-agent-threat-model/protect-playbook';
  const OUTPUT = 'public/wiki-index-ai-agent.json';

  // Threats
  const threatFiles = fs.readdirSync(THREAT_DIR).filter(f => f.endsWith('.md'));
  const threats = [];

  for (const file of threatFiles) {
    const content = fs.readFileSync(path.join(THREAT_DIR, file), 'utf-8');
    const meta = parseFrontmatter(content);
    if (!meta) continue;

    const name = file.replace(/\.md$/, '');
    threats.push({
      folder: name,
      title: (meta['title'] || '').replace(/^"|"$/g, '') || name,
      threatId: String(meta['威胁序号'] || ''),
      threatName: (meta['Threat Name'] || '').replace(/^"|"$/g, ''),
      evaluationStep: meta['威胁评估步骤'] || '',
      category: meta['威胁类别'] || '',
      playbookNames: splitCommaField(meta['防护剧本名称'] || ''),
      owaspRelation: normalizeArray(meta['与 OWASP Top 10 for LLM 的关联'] || meta['与 OWASP Top 10 for LLM的关联'] || meta['OWASP Top 10 for LLM的关联'] || ''),
      agenticAiRelation: normalizeArray(meta['与 OWASP Top 10 for Agentic AI 的关联'] || meta['与 OWASP Top 10 for Agentic AI的关联'] || ''),
    });
  }

  threats.sort((a, b) => {
    const na = parseInt(a.threatId.replace('T', ''));
    const nb = parseInt(b.threatId.replace('T', ''));
    return na - nb;
  });

  // Playbooks
  const playbookFiles = fs.readdirSync(PLAYBOOK_DIR).filter(f => f.endsWith('.md'));
  const playbooks = [];

  for (const file of playbookFiles) {
    const content = fs.readFileSync(path.join(PLAYBOOK_DIR, file), 'utf-8');
    const meta = parseFrontmatter(content);
    if (!meta) continue;

    const name = file.replace(/\.md$/, '');
    playbooks.push({
      folder: name,
      title: (meta['title'] || '').replace(/^"|"$/g, '') || name,
      evaluationStep: meta['威胁评估步骤'] || '',
      relatedThreats: splitCommaField(meta['威胁名称'] || ''),
      playbookId: (meta['剧本序号'] || '').replace(/^"|"$/g, '') || ((meta['title'] || '').match(/剧本\s*(\d+)/) || [])[1] || '',
    });
  }

  // Categories (from unique category values)
  const seenCategories = new Set(threats.map(t => t.category));
  const categories = [...seenCategories].map(name => ({
    id: CATEGORY_MAP[name]?.id || name,
    name,
    color: CATEGORY_MAP[name]?.color || '#71717a',
    icon: CATEGORY_MAP[name]?.icon || '📋',
  }));

  fs.writeFileSync(OUTPUT, JSON.stringify({ threats, playbooks, categories }, null, 2) + '\n');
  console.log(`Generated ${OUTPUT}: Threats=${threats.length} Playbooks=${playbooks.length} Categories=${categories.length}`);
}

// ─── Run both ──────────────────────────────────────────────────
generateOpenClawIndex();
generateAIAgentIndex();
