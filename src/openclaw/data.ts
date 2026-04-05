import { fetchMarkdown, extractBody, extractSection, renderMarkdown } from '../shared/markdown';
import { getSeverityColor } from '../shared/render-helpers';

// ─── Types ──────────────────────────────────────────────────────
export type SeverityLevel = '严重' | '高危' | '中危' | '低危';

export interface ThreatEntry {
  title: string;
  layer: string;
  layerIndex: number;
  severity: SeverityLevel;
  id: string;
  sourcePaths: string[];
  layerDescription: string;
  description: string;
  mitigation: string;
  rawContent: string;
}

export interface MaestroLayer {
  index: number;
  name: string;
  shortName: string;
  id: string;
  description: string;
  color: string;
  icon: string;
  threats: ThreatEntry[];
}

export interface SearchResult {
  type: 'threat' | 'cli';
  id?: string;
  title: string;
  folder: string;
  matchField: string;
  snippet: string;
}

// ─── Layer metadata ────────────────────────────────────────────
const LAYER_META: Omit<MaestroLayer, 'threats'>[] = [
  { index: 1, name: '基础模型', shortName: 'Foundation Model', id: 'LM', description: 'LLM 层面的威胁：提示词注入、越狱攻击、凭证泄露、系统提示词泄漏', color: '#60a5fa', icon: '🧠' },
  { index: 2, name: '数据操作', shortName: 'Data Operations', id: 'DO', description: '数据处理层面的威胁：凭证存储、状态目录权限、会话历史、向量数据库投毒', color: '#a78bfa', icon: '💾' },
  { index: 3, name: '智能体框架', shortName: 'Agent Framework', id: 'AF', description: '框架层面的威胁：工具滥用、会话派生、跨会话信息泄漏、沙箱逃逸', color: '#f472b6', icon: '🤖' },
  { index: 4, name: '部署与基础设施', shortName: 'Deployment & Infra', id: 'DI', description: '基础设施层面的威胁：网关暴露、代理欺骗、运行时漏洞、Docker Socket 暴露', color: '#fb923c', icon: '☁️' },
  { index: 5, name: '评估与可观测性', shortName: 'Evaluation & Observability', id: 'EO', description: '监控缺口：日志记录不足、异常检测缺失、审计日志完整性、探测失败', color: '#facc15', icon: '🔍' },
  { index: 6, name: '安全与合规', shortName: 'Security & Compliance', id: 'SC', description: '策略层面的威胁：开放的私信策略、群聊访问控制、配对码暴力破解、身份欺骗', color: '#4ade80', icon: '🛡️' },
  { index: 7, name: '智能体生态系统', shortName: 'Agent Ecosystem', id: 'AE', description: '生态系统层面的威胁：恶意插件、供应链攻击、技能仓库投毒、智能体冒充', color: '#f43f5e', icon: '🌐' },
];

// ─── JSON index types ──────────────────────────────────────────
interface ThreatIndexEntry {
  folder: string;
  title: string;
  layer: string;
  severity: string;
  id: string;
  sourcePaths: string[];
  layerDescription: string;
}

interface CLIIndexEntry {
  folder: string;
  title: string;
}

interface ThreatIndex {
  threats: ThreatIndexEntry[];
  cliCommands: CLIIndexEntry[];
}

// ─── Cache ────────────────────────────────────────────────────
let indexCache: ThreatIndex | null = null;
const MD_BASE = '/wiki/openclaw-threat-model';

async function loadIndex(): Promise<ThreatIndex> {
  if (indexCache) return indexCache;
  const resp = await fetch('/wiki-index-openclaw.json');
  indexCache = await resp.json();
  return indexCache!;
}

function parseLayerIndex(layerStr: string): number {
  const m = layerStr.match(/第(\d)层/);
  return m ? parseInt(m[1]) : 0;
}

// ─── Public API ───────────────────────────────────────────────
export function getLayerMeta() { return LAYER_META; }

export function getLayerForId(id: string) {
  return LAYER_META.find(l => id.startsWith(l.id)) || LAYER_META[0];
}

export { getSeverityColor };

export async function buildLayers(): Promise<MaestroLayer[]> {
  const index = await loadIndex();
  return LAYER_META.map(meta => {
    const threats: ThreatEntry[] = index.threats
      .filter(t => t.id.startsWith(meta.id))
      .map(t => ({
        title: t.title,
        layer: t.layer,
        layerIndex: parseLayerIndex(t.layer),
        severity: t.severity as ThreatEntry['severity'],
        id: t.id,
        sourcePaths: t.sourcePaths || [],
        layerDescription: t.layerDescription || meta.description,
        description: '',
        mitigation: '',
        rawContent: '',
      }));
    return { ...meta, threats };
  });
}

export async function loadThreatDetail(threatId: string): Promise<ThreatEntry | null> {
  const index = await loadIndex();
  const entry = index.threats.find(t => t.id === threatId);
  if (!entry) return null;

  const md = await fetchMarkdown(MD_BASE, entry.folder);
  const body = extractBody(md);
  const descRaw = extractSection(body, '威胁描述');
  const mitRaw = extractSection(body, '缓解措施');

  return {
    title: entry.title,
    layer: entry.layer,
    layerIndex: parseLayerIndex(entry.layer),
    severity: entry.severity as ThreatEntry['severity'],
    id: entry.id,
    sourcePaths: entry.sourcePaths || [],
    layerDescription: entry.layerDescription || getLayerForId(threatId).description,
    description: descRaw ? await renderMarkdown(descRaw) : '',
    mitigation: mitRaw ? await renderMarkdown(mitRaw) : '',
    rawContent: md,
  };
}

export async function loadCLIDetail(folder: string): Promise<string> {
  const md = await fetchMarkdown(MD_BASE, folder);
  const body = extractBody(md);
  return body ? await renderMarkdown(body) : '';
}

export async function getCLIList(): Promise<CLIIndexEntry[]> {
  const index = await loadIndex();
  return index.cliCommands;
}

export async function getSortedThreatIds(): Promise<string[]> {
  const layers = await buildLayers();
  return layers.flatMap(l => l.threats.map(t => t.id));
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

  // Preload all markdown
  await Promise.all([
    ...index.threats.map(t => fetchMarkdown(MD_BASE, t.folder)),
    ...index.cliCommands.map(c => fetchMarkdown(MD_BASE, c.folder)),
  ]);

  for (const t of index.threats) {
    if (results.some(r => r.type === 'threat' && r.id === t.id)) continue;
    if (t.title.toLowerCase().includes(q)) {
      results.push({ type: 'threat', id: t.id, title: t.title, folder: t.folder, matchField: 'title', snippet: '' });
      continue;
    }
    if (t.id.toLowerCase().includes(q)) {
      results.push({ type: 'threat', id: t.id, title: t.title, folder: t.folder, matchField: 'id', snippet: '' });
      continue;
    }
    if (t.sourcePaths.some(p => p.toLowerCase().includes(q))) {
      results.push({ type: 'threat', id: t.id, title: t.title, folder: t.folder, matchField: 'sourcePaths', snippet: '' });
      continue;
    }
    const { extractBody: eb } = await import('../shared/markdown');
    const md = await fetchMarkdown(MD_BASE, t.folder);
    const body = eb(md);
    if (body.toLowerCase().includes(q)) {
      results.push({ type: 'threat', id: t.id, title: t.title, folder: t.folder, matchField: 'content', snippet: extractSnippet(body, query) });
    }
  }

  for (const c of index.cliCommands) {
    if (c.title.toLowerCase().includes(q)) {
      results.push({ type: 'cli', title: c.title, folder: c.folder, matchField: 'title', snippet: '' });
      continue;
    }
    const { extractBody: eb } = await import('../shared/markdown');
    const md = await fetchMarkdown(MD_BASE, c.folder);
    const body = eb(md);
    if (body.toLowerCase().includes(q)) {
      results.push({ type: 'cli', title: c.title, folder: c.folder, matchField: 'content', snippet: extractSnippet(body, query) });
    }
  }

  return results;
}
