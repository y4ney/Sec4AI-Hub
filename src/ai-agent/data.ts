import { fetchMarkdown, extractBody, extractSection, renderMarkdown } from '../shared/markdown';

// ─── Types ──────────────────────────────────────────────────────
export interface AgentThreatIndexEntry {
  folder: string;
  title: string;
  threatId: string;
  threatName: string;
  evaluationStep: string;
  category: string;
  playbookNames: string[];
}

export interface PlaybookIndexEntry {
  folder: string;
  title: string;
  evaluationStep: string;
  relatedThreats: string[];
  playbookId: string;
}

export interface CategoryMeta {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface AgentThreatDetail {
  folder: string;
  title: string;
  threatId: string;
  threatName: string;
  evaluationStep: string;
  category: string;
  categoryMeta: CategoryMeta;
  playbookNames: string[];
  description: string;
  owaspRelation: string;
  attackScenarios: string;
  mitigation: string;
  rawContent: string;
}

export interface PlaybookDetail {
  folder: string;
  title: string;
  playbookId: string;
  evaluationStep: string;
  relatedThreats: string[];
  sections: { title: string; html: string }[];
  rawContent: string;
}

export interface ThreatCategoryGroup {
  meta: CategoryMeta;
  threats: AgentThreatIndexEntry[];
}

export interface StepGroup {
  stepIndex: number;
  stepLabel: string;      // e.g. "步骤 2：AI Agent 是否依赖存储的记忆进行决策？"
  category: string;
  categoryMeta: CategoryMeta;
  threats: AgentThreatIndexEntry[];
}

export interface SearchResult {
  type: 'threat' | 'playbook';
  id?: string;
  title: string;
  folder: string;
  matchField: string;
  snippet: string;
  playbookId?: string;
}

// ─── Index types ──────────────────────────────────────────────
interface AgentThreatIndex {
  threats: AgentThreatIndexEntry[];
  playbooks: PlaybookIndexEntry[];
  categories: CategoryMeta[];
}

// ─── Cache ────────────────────────────────────────────────────
let indexCache: AgentThreatIndex | null = null;
const MD_BASE_THREAT = '/wiki/ai-agent-threat-model/theat-database';
const MD_BASE_PLAYBOOK = '/wiki/ai-agent-threat-model/protect-playbook';

async function loadIndex(): Promise<AgentThreatIndex> {
  if (indexCache) return indexCache;
  const resp = await fetch('/wiki-index-ai-agent.json');
  indexCache = await resp.json();
  return indexCache!;
}

function getCategoryMeta(categoryName: string, categories: CategoryMeta[]): CategoryMeta {
  return categories.find(c => c.name === categoryName) || { id: 'unknown', name: categoryName, color: '#71717a', icon: '📋' };
}

// ─── Public API ───────────────────────────────────────────────
export async function getCategories(): Promise<CategoryMeta[]> {
  const index = await loadIndex();
  return index.categories;
}

export async function buildCategoryGroups(): Promise<ThreatCategoryGroup[]> {
  const index = await loadIndex();
  return index.categories.map(cat => ({
    meta: cat,
    threats: index.threats.filter(t => t.category === cat.name),
  })).filter(g => g.threats.length > 0);
}

export async function buildStepGroups(): Promise<StepGroup[]> {
  const index = await loadIndex();
  // Collect unique steps
  const seen = new Map<string, { step: string; category: string }>();
  for (const t of index.threats) {
    if (!seen.has(t.evaluationStep)) {
      seen.set(t.evaluationStep, { step: t.evaluationStep, category: t.category });
    }
  }

  // Sort by step number extracted from the step string
  const sorted = [...seen.values()].sort((a, b) => {
    const na = parseInt((a.step.match(/步骤\s*(\d+)/) || a.step.match(/步骤\s*(\d+)/) || [])[1] || '0');
    const nb = parseInt((b.step.match(/步骤\s*(\d+)/) || b.step.match(/步骤\s*(\d+)/) || [])[1] || '0');
    return na - nb;
  });

  const groups: StepGroup[] = [];
  let stepIdx = 1;
  for (const val of sorted) {
    const threats = index.threats.filter(t => t.evaluationStep === val.step);
    if (threats.length > 0) {
      groups.push({
        stepIndex: stepIdx++,
        stepLabel: val.step,
        category: val.category,
        categoryMeta: getCategoryMeta(val.category, index.categories),
        threats,
      });
    }
  }
  return groups;
}

export async function loadThreatDetail(threatId: string): Promise<AgentThreatDetail | null> {
  const index = await loadIndex();
  const entry = index.threats.find(t => t.threatId === threatId);
  if (!entry) return null;

  const md = await fetchMarkdown(MD_BASE_THREAT, entry.folder);
  const body = extractBody(md);

  const descRaw = extractSection(body, '威胁描述');
  const owaspRaw = extractSection(body, 'OWASP');
  const attackRaw = extractSection(body, '攻击场景');
  const mitRaw = extractSection(body, '缓解方法');

  return {
    folder: entry.folder,
    title: entry.title,
    threatId: entry.threatId,
    threatName: entry.threatName,
    evaluationStep: entry.evaluationStep,
    category: entry.category,
    categoryMeta: getCategoryMeta(entry.category, index.categories),
    playbookNames: entry.playbookNames,
    description: descRaw ? await renderMarkdown(descRaw) : '',
    owaspRelation: owaspRaw ? await renderMarkdown(owaspRaw) : '',
    attackScenarios: attackRaw ? await renderMarkdown(attackRaw) : '',
    mitigation: mitRaw ? await renderMarkdown(mitRaw) : '',
    rawContent: md,
  };
}

export async function loadPlaybookDetail(playbookId: string): Promise<PlaybookDetail | null> {
  const index = await loadIndex();
  const entry = index.playbooks.find(p => p.playbookId === playbookId || p.folder === playbookId);
  if (!entry) return null;

  const md = await fetchMarkdown(MD_BASE_PLAYBOOK, entry.folder);
  const body = extractBody(md);

  const sectionHeadings = ['核心目标', '主动防护', '被动响应', '检测监控'];
  const sections = sectionHeadings
    .map(h => {
      const raw = extractSection(body, h);
      return raw ? { title: h, html: '' } : null;
    })
    .filter(Boolean) as { title: string; html: string }[];

  for (const s of sections) {
    const raw = extractSection(body, s.title);
    s.html = raw ? await renderMarkdown(raw) : '';
  }

  return {
    folder: entry.folder,
    title: entry.title,
    playbookId: entry.playbookId,
    evaluationStep: entry.evaluationStep,
    relatedThreats: entry.relatedThreats,
    sections,
    rawContent: md,
  };
}

export async function getSortedThreatIds(): Promise<string[]> {
  const index = await loadIndex();
  return index.threats.map(t => t.threatId).sort((a, b) => {
    return parseInt(a.replace('T', '')) - parseInt(b.replace('T', ''));
  });
}

export async function getAllThreats(): Promise<AgentThreatIndexEntry[]> {
  const index = await loadIndex();
  return index.threats;
}

export async function getAllPlaybooks(): Promise<PlaybookIndexEntry[]> {
  const index = await loadIndex();
  return index.playbooks;
}

export async function getSortedPlaybookIds(): Promise<string[]> {
  const index = await loadIndex();
  return index.playbooks
    .map(p => p.playbookId)
    .sort((a, b) => parseInt(a.replace('P', '')) - parseInt(b.replace('P', '')));
}

export async function getPlaybookTitleMap(): Promise<Record<string, string>> {
  const index = await loadIndex();
  const map: Record<string, string> = {};
  for (const p of index.playbooks) map[p.playbookId] = p.title;
  return map;
}

export async function getThreatTitleMap(): Promise<Record<string, string>> {
  const index = await loadIndex();
  const map: Record<string, string> = {};
  for (const t of index.threats) map[t.threatId] = t.title;
  return map;
}

export async function getThreatNameToIdMap(): Promise<Record<string, string>> {
  const index = await loadIndex();
  const map: Record<string, string> = {};
  for (const t of index.threats) map[t.title] = t.threatId;
  return map;
}

function extractSnippet(text: string, query: string, radius = 40): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  let snippet = text.slice(start, end).replace(/\n/g, ' ').trim();
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

export async function search(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const index = await loadIndex();
  const results: SearchResult[] = [];

  await Promise.all(index.threats.map(t => fetchMarkdown(MD_BASE_THREAT, t.folder)));

  for (const t of index.threats) {
    if (results.some(r => r.id === t.threatId)) continue;
    if (t.title.toLowerCase().includes(q)) {
      results.push({ type: 'threat', id: t.threatId, title: t.title, folder: t.folder, matchField: 'title', snippet: '' });
      continue;
    }
    if (t.threatId.toLowerCase().includes(q)) {
      results.push({ type: 'threat', id: t.threatId, title: t.title, folder: t.folder, matchField: 'id', snippet: '' });
      continue;
    }
    if (t.threatName.toLowerCase().includes(q)) {
      results.push({ type: 'threat', id: t.threatId, title: t.title, folder: t.folder, matchField: 'threatName', snippet: '' });
      continue;
    }
    const md = await fetchMarkdown(MD_BASE_THREAT, t.folder);
    const body = extractBody(md);
    if (body.toLowerCase().includes(q)) {
      results.push({ type: 'threat', id: t.threatId, title: t.title, folder: t.folder, matchField: 'content', snippet: extractSnippet(body, query) });
    }
  }

  for (const p of index.playbooks) {
    if (p.title.toLowerCase().includes(q)) {
      results.push({ type: 'playbook', title: p.title, folder: p.folder, matchField: 'title', snippet: '', playbookId: p.playbookId });
      continue;
    }
    const md = await fetchMarkdown(MD_BASE_PLAYBOOK, p.folder);
    const body = extractBody(md);
    if (body.toLowerCase().includes(q)) {
      results.push({ type: 'playbook', title: p.title, folder: p.folder, matchField: 'content', snippet: extractSnippet(body, query), playbookId: p.playbookId });
    }
  }

  return results;
}
