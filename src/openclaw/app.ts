import { buildLayers, getCLIList, loadThreatDetail, loadCLIDetail, getSeverityColor, getLayerForId, getSortedThreatIds, search } from './data';
import type { MaestroLayer, ThreatEntry, SearchResult } from './data';
import { renderNavbar } from '../shared/navbar';
import { renderFooter } from '../shared/footer';
import { escapeAttr, statBlock, renderSearchDropdown } from '../shared/render-helpers';
import { navigate, type Route } from '../shared/router';

// ─── State ──────────────────────────────────────────────────────
let activeSeverityFilter: string | null = null;
let sortedThreatIds: string[] = [];
let threatTitleMap: Record<string, string> = {};
let searchQuery = '';
let searchResults: SearchResult[] = [];

async function ensureSortedIds(): Promise<string[]> {
  if (sortedThreatIds.length === 0) sortedThreatIds = await getSortedThreatIds();
  return sortedThreatIds;
}

async function ensureTitleMap(): Promise<void> {
  if (Object.keys(threatTitleMap).length === 0) {
    const layers = await buildLayers();
    threatTitleMap = {};
    for (const l of layers) for (const t of l.threats) threatTitleMap[t.id] = t.title;
  }
}

// ─── Home Page ────────────────────────────────────────────────
async function renderHomePage(): Promise<string> {
  const layers = await buildLayers();
  const allThreats = layers.flatMap(l => l.threats);
  const cliList = await getCLIList();
  const filteredCount = activeSeverityFilter ? countSev(allThreats, activeSeverityFilter) : allThreats.length;

  return `
    ${renderNavbar({ subProject: 'openclaw', searchValue: searchQuery })}
    <main class="main-content">
      <header class="page-header">
        <div class="header-grid">
          <div class="header-left">
            <div class="sys-badge">SYS::OPENCLAW_DB v1.0</div>
            <h1 class="page-title">
              <span class="title-bracket">[</span>
              OpenClaw MAESTRO 威胁模型
              <span class="title-bracket">]</span>
            </h1>
            <p class="page-desc">基于 MAESTRO 七层防御框架的 Agentic AI 系统安全威胁知识库</p>
          </div>
          <div class="header-right">
            <div class="stat-row">
              ${statBlock(allThreats.length, 'TOTAL', '', '')}
              ${statBlock(countSev(allThreats, '严重'), 'CRITICAL', 'sev-critical', '严重')}
              ${statBlock(countSev(allThreats, '高危'), 'HIGH', 'sev-high', '高危')}
              ${statBlock(countSev(allThreats, '中危'), 'MEDIUM', 'sev-mid', '中危')}
              ${statBlock(countSev(allThreats, '低危'), 'LOW', 'sev-low', '低危')}
            </div>
          </div>
        </div>
      </header>

      <section class="table-section">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-icon">⊞</span>
            <span>威胁数据库</span>
            <span class="record-count">${filteredCount} records</span>
          </div>
          <span class="scan-line">SCAN COMPLETE</span>
        </div>
        <div class="table-wrapper">
          <table class="threat-table">
            <thead>
              <tr>
                <th class="col-id">威胁序号</th>
                <th class="col-title">威胁名称</th>
                <th class="col-severity">威胁等级</th>
                <th class="col-srcpath">OpenClaw 源码路径</th>
              </tr>
            </thead>
            <tbody>
              ${renderLayerGroups(layers, activeSeverityFilter)}
            </tbody>
          </table>
        </div>
      </section>

      <section class="cli-section">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-icon">$</span>
            <span>安全审计 CLI</span>
            <span class="record-count">${cliList.length} commands</span>
          </div>
        </div>
        <div class="cli-list">
          ${cliList.map(c => `
            <div class="cli-row" data-nav="openclaw-cli" data-folder="${c.title}">
              <span class="cli-title">${c.title}</span>
              <span class="cli-arrow">→</span>
            </div>
          `).join('')}
        </div>
      </section>

      ${renderFooter()}
    </main>`;
}

function countSev(threats: ThreatEntry[], sev: string): number {
  return threats.filter(t => t.severity === sev).length;
}

const SOURCE_PATH_TIPS: Record<string, string> = {
  'N/A — Gap Identified': '代码里根本没有处理这个安全问题的逻辑，需要从零开发。',
  'All Channel Monitors': '这个威胁不是针对某一个具体文件，而是涉及所有通信频道的监控模块。',
};

function renderSourceTag(p: string): string {
  const tip = SOURCE_PATH_TIPS[p];
  if (tip) {
    return `<span class="src-tag src-tag-special" data-tip="${escapeAttr(tip)}"><span class="src-tag-text">${p}</span><span class="src-tag-q">?</span></span>`;
  }
  return `<span class="src-tag">${p}</span>`;
}

// ─── Layer Groups ─────────────────────────────────────────────
function renderLayerGroups(layers: MaestroLayer[], filter: string | null): string {
  return layers.filter(l => l.threats.length > 0).map(layer => {
    const filteredThreats = filter ? layer.threats.filter(t => t.severity === filter) : layer.threats;
    if (filteredThreats.length === 0) return '';
    return `
    <tr class="layer-group-row">
      <td colspan="4">
        <div class="layer-group-header" style="--tag-color: ${layer.color}">
          <div class="layer-group-title">
            <span class="layer-num">L${layer.index}</span>
            第${layer.index}层 — ${layer.name}
            <span class="layer-group-en">${layer.shortName}</span>
            <span class="layer-group-count">${filteredThreats.length}</span>
          </div>
          <div class="layer-group-desc">${layer.description}</div>
        </div>
      </td>
    </tr>
    ${filteredThreats.map(t => `
      <tr class="table-row" data-nav="openclaw-threat" data-id="${t.id}">
        <td class="col-id"><code class="id-code" style="--layer-color: ${layer.color}">${t.id}</code></td>
        <td class="col-title"><span class="threat-link">${t.title}</span></td>
        <td class="col-severity">
          <span class="sev-dot" style="background:${getSeverityColor(t.severity)}"></span>
          <span class="sev-text" style="color:${getSeverityColor(t.severity)}">${t.severity}</span>
        </td>
        <td class="col-srcpath">
          ${(t.sourcePaths || []).filter(Boolean).map(p => renderSourceTag(p)).join('')}
        </td>
      </tr>
    `).join('')}
  `;
  }).join('');
}

// ─── Threat Detail Page ───────────────────────────────────────
function renderThreatPage(threat: ThreatEntry, prevId: string | null, nextId: string | null): string {
  const lm = getLayerForId(threat.id);
  return `
    ${renderNavbar({ subProject: 'openclaw' })}
    <main class="main-content">
      <div class="breadcrumb">
        <span class="bc-link" data-nav="openclaw-home">威胁数据库</span>
        <span class="bc-sep">/</span>
        <span class="bc-current">${threat.id}</span>
      </div>

      <div class="detail-header" style="--layer-color: ${lm.color}">
        <div class="detail-header-top">
          <code class="detail-id">${threat.id}</code>
          <span class="detail-sev" style="color:${getSeverityColor(threat.severity)};border-color:${getSeverityColor(threat.severity)}">${threat.severity}</span>
          <span class="layer-tag" style="--tag-color: ${lm.color}">L${threat.layerIndex} ${lm.name}</span>
        </div>
        <h1 class="detail-title">${threat.title}</h1>
        <div class="detail-fields">
          <div class="detail-field">
            <span class="field-key">OpenClaw 源码路径</span>
            <div class="field-value">
              ${(threat.sourcePaths || []).filter(Boolean).map(p => renderSourceTag(p)).join('')}
            </div>
          </div>
          <div class="detail-field">
            <span class="field-key">层级说明</span>
            <span class="field-value">${threat.layerDescription}</span>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-pane">
          <div class="pane-header">
            <span class="pane-icon attack-icon">⟐</span>
            <h2>威胁描述 <span class="pane-title-en">Threat Description</span></h2>
            <span class="pane-line"></span>
          </div>
          <div class="pane-content prose">${threat.description || '<div class="loading-inner"><div class="spinner"></div>DECRYPTING...</div>'}</div>
        </div>
        <div class="detail-pane">
          <div class="pane-header">
            <span class="pane-icon shield-icon">◆</span>
            <h2>缓解措施 <span class="pane-title-en">Mitigation</span></h2>
            <span class="pane-line"></span>
          </div>
          <div class="pane-content prose">${threat.mitigation || '<div class="loading-inner"><div class="spinner"></div>DECRYPTING...</div>'}</div>
        </div>
      </div>

      ${renderPrevNextNav(prevId, nextId)}
      ${renderFooter()}
    </main>`;
}

function renderPrevNextNav(prevId: string | null, nextId: string | null): string {
  const prevTitle = prevId ? threatTitleMap[prevId] || '' : '';
  const nextTitle = nextId ? threatTitleMap[nextId] || '' : '';
  return `
    <div class="prev-next-nav">
      <div class="prev-next-inner">
        ${prevId ? `
          <button class="pn-btn pn-prev" data-nav="openclaw-threat" data-id="${prevId}">
            <span class="pn-arrow">←</span>
            <span class="pn-label">${prevId}：${prevTitle}</span>
          </button>
        ` : '<div></div>'}
        ${nextId ? `
          <button class="pn-btn pn-next" data-nav="openclaw-threat" data-id="${nextId}">
            <span class="pn-label">${nextId}：${nextTitle}</span>
            <span class="pn-arrow">→</span>
          </button>
        ` : '<div></div>'}
      </div>
    </div>`;
}

// ─── CLI Detail ───────────────────────────────────────────────
function renderCLIDetailPage(title: string, content: string): string {
  return `
    ${renderNavbar({ subProject: 'openclaw' })}
    <main class="main-content">
      <div class="breadcrumb">
        <span class="bc-link" data-nav="openclaw-home">安全审计 CLI</span>
        <span class="bc-sep">/</span>
        <span class="bc-current">${title}</span>
      </div>
      <div class="cli-detail-hero"><h1 class="detail-title">${title}</h1></div>
      <div class="detail-pane" style="margin-top:32px">
        <div class="pane-content prose">${content || '<div class="loading-inner"><div class="spinner"></div>LOADING...</div>'}</div>
      </div>
      ${renderFooter()}
    </main>`;
}

// ─── Search ──────────────────────────────────────────────────
async function handleSearchInput(e: Event) {
  searchQuery = (e.target as HTMLInputElement).value;
  searchResults = await search(searchQuery);

  const wrapper = document.querySelector('.search-wrapper');
  if (!wrapper) return;

  let existing = wrapper.querySelector('.search-dropdown');
  if (existing) existing.remove();

  if (!searchQuery.trim()) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'search-dropdown';
  const items = searchResults.map(r => ({
    type: r.type === 'threat' ? r.id || 'OC' : 'CLI',
    title: r.title,
    snippet: r.snippet,
    nav: r.type === 'threat' ? 'openclaw-threat' : 'openclaw-cli',
    dataAttr: r.type === 'threat' ? `data-id="${r.id}"` : `data-folder="${r.folder}"`,
  }));
  dropdown.innerHTML = renderSearchDropdown(items, searchQuery);
  wrapper.appendChild(dropdown);
}

// ─── Public render ───────────────────────────────────────────
export async function render(container: HTMLElement, route: Route): Promise<void> {
  const app = container;
  if (route.page === 'openclaw-home') {
    app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><span>LOADING THREAT DATABASE...</span></div>';
    app.innerHTML = await renderHomePage();
  } else if (route.page === 'openclaw-threat') {
    app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><span>DECRYPTING THREAT DATA...</span></div>';
    const ids = await ensureSortedIds();
    await ensureTitleMap();
    const threat = await loadThreatDetail(route.threatId);
    if (!threat) {
      app.innerHTML = '<div class="loading-screen"><span>ERROR: THREAT NOT FOUND</span></div>';
      return;
    }
    const idx = ids.indexOf(threat.id);
    const prevId = idx > 0 ? ids[idx - 1] : null;
    const nextId = idx < ids.length - 1 ? ids[idx + 1] : null;
    app.innerHTML = renderThreatPage(threat, prevId, nextId);
  } else if (route.page === 'openclaw-cli') {
    app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><span>LOADING...</span></div>';
    const content = await loadCLIDetail(route.folder);
    app.innerHTML = renderCLIDetailPage(route.folder, content);
  }

  // Bind events
  app.addEventListener('click', handleFilterClick);
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) searchInput.addEventListener('input', handleSearchInput);
}

function handleFilterClick(e: Event) {
  const filterTarget = (e.target as HTMLElement).closest('[data-filter]') as HTMLElement;
  if (filterTarget) {
    e.preventDefault();
    e.stopPropagation();
    const severity = filterTarget.dataset.filter!;
    activeSeverityFilter = (severity === '' || activeSeverityFilter === severity) ? null : severity;
    // Re-render via top-level route change
    navigate({ page: 'openclaw-home' }, true);
  }
}
