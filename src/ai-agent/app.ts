import { buildStepGroups, loadThreatDetail, loadPlaybookDetail, getTableOrderedThreatIds, getSortedPlaybookIds, getPlaybookTitleMap, getAllPlaybooks, getThreatTitleMap, getThreatNameToIdMap, search } from './data';
import type { StepGroup, AgentThreatDetail, PlaybookDetail, SearchResult } from './data';
import { renderNavbar } from '../shared/navbar';
import { renderFooter } from '../shared/footer';
import { renderSearchDropdown } from '../shared/render-helpers';
import type { Route } from '../shared/router';

// ─── State ──────────────────────────────────────────────────────
let searchQuery = '';
let searchResults: SearchResult[] = [];
let threatTitleMap: Record<string, string> = {};
let threatNameToId: Record<string, string> = {};
let playbookTitleMap: Record<string, string> = {};

async function ensureTitleMap(): Promise<void> {
  if (Object.keys(threatTitleMap).length === 0) {
    threatTitleMap = await getThreatTitleMap();
    threatNameToId = await getThreatNameToIdMap();
  }
  if (Object.keys(playbookTitleMap).length === 0) {
    playbookTitleMap = await getPlaybookTitleMap();
  }
}

// ─── List Page ────────────────────────────────────────────────
async function renderListPage(): Promise<string> {
  const groups = await buildStepGroups();
  const playbooks = (await getAllPlaybooks()).sort((a, b) => parseInt(a.playbookId.replace('P', '')) - parseInt(b.playbookId.replace('P', '')));
  const totalThreats = groups.reduce((sum, g) => sum + g.threats.length, 0);

  return `
    ${renderNavbar({ subProject: 'ai-agent', searchValue: searchQuery })}
    <main class="main-content">
      <header class="page-header">
        <div class="header-grid">
          <div class="header-left">
            <div class="sys-badge">SYS::AGENT_THREATS v1.0</div>
            <h1 class="page-title">
              <span class="title-bracket">[</span>
              AI Agent 威胁模型
              <span class="title-bracket">]</span>
            </h1>
            <p class="page-desc">AI Agent 系统安全威胁与防护剧本知识库</p>
          </div>
          <div class="header-right">
            <div class="stat-row">
              <div class="stat-block"><span class="stat-val">${totalThreats}</span><span class="stat-key">THREATS</span></div>
              <div class="stat-block"><span class="stat-val">${groups.length}</span><span class="stat-key">STEPS</span></div>
              <div class="stat-block"><span class="stat-val">${playbooks.length}</span><span class="stat-key">PLAYBOOKS</span></div>
            </div>
          </div>
        </div>
      </header>

      <section class="table-section">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-icon">⊞</span>
            <span>威胁数据库</span>
            <span class="record-count">${totalThreats} records</span>
          </div>
          <span class="scan-line">SCAN COMPLETE</span>
        </div>
        <div class="table-wrapper">
          <table class="threat-table">
            <thead>
              <tr>
                <th class="col-id">威胁序号</th>
                <th class="col-title">威胁名称</th>
                <th class="col-owasp">OWASP Top 10 for LLM</th>
                <th class="col-owasp">OWASP Top 10 for Agentic AI</th>
                <th class="col-srcpath">防护剧本</th>
              </tr>
            </thead>
            <tbody>
              ${renderStepGroups(groups)}
            </tbody>
          </table>
        </div>
      </section>

      <section class="cli-section">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="toolbar-icon">⊞</span>
            <span>防护剧本</span>
            <span class="record-count">${playbooks.length} playbooks</span>
          </div>
        </div>
        <div class="cli-list">
          ${playbooks.map(p => `
            <div class="cli-row" data-nav="ai-agent-playbook" data-playbook-id="${p.playbookId}">
              <span class="cli-title">${p.title}</span>
              <span class="cli-arrow">→</span>
            </div>
          `).join('')}
        </div>
      </section>

      ${renderFooter()}
    </main>`;
}

function renderStepGroups(groups: StepGroup[]): string {
  return groups.map(group => {
    const color = group.categoryMeta.color;
    return `
    <tr class="layer-group-row">
      <td colspan="5">
        <div class="layer-group-header" style="--tag-color: ${color}">
          <div class="layer-group-title">
            <span class="layer-num">S${group.stepIndex}</span>
            ${group.stepLabel.replace(/^S\s*(\d+)\s*[：:]/, (_, n) => `步骤${n}：`)}
            <span class="layer-group-count">${group.threats.length}</span>
          </div>
          <div class="layer-group-desc">${group.category}</div>
        </div>
      </td>
    </tr>
    ${group.threats.map(t => `
      <tr class="table-row" data-nav="ai-agent-threat" data-id="${t.threatId}">
        <td class="col-id"><code class="id-code" style="--layer-color: ${color}">${t.threatId}</code></td>
        <td class="col-title">
          <span class="threat-link">${t.title}</span>
          ${t.owaspRelation.length === 0 ? '<span class="new-badge new-badge-sm">NEW</span>' : ''}
        </td>
        <td class="col-owasp">
          ${t.owaspRelation.length > 0
            ? t.owaspRelation.map(o => `<span class="src-tag owasp-tag">${o}</span>`).join('')
            : '<span class="no-data">—</span>'}
        </td>
        <td class="col-owasp">
          ${t.agenticAiRelation?.length > 0
            ? t.agenticAiRelation.map((o: string) => `<span class="src-tag agentic-ai-tag">${o}</span>`).join('')
            : '<span class="no-data">—</span>'}
        </td>
        <td class="col-srcpath">
          ${t.playbookNames.map(p => `<span class="src-tag">${p}</span>`).join('')}
        </td>
      </tr>
    `).join('')}
  `;
  }).join('');
}

// ─── Threat Detail Page ───────────────────────────────────────
function renderThreatPage(threat: AgentThreatDetail, prevId: string | null, nextId: string | null): string {
  const catColor = threat.categoryMeta.color;
  return `
    ${renderNavbar({ subProject: 'ai-agent' })}
    <main class="main-content">
      <div class="breadcrumb">
        <span class="bc-link" data-nav="ai-agent-home">AI Agent 威胁模型</span>
        <span class="bc-sep">/</span>
        <span class="bc-current">${threat.title}</span>
      </div>

      <div class="detail-header" style="--layer-color: ${catColor}">
        <div class="detail-header-top">
          <code class="detail-id">${threat.threatId}</code>
          <span class="layer-tag" style="--tag-color: ${catColor}">${threat.category}</span>
          ${threat.owaspRelation.length === 0 ? '<span class="new-badge">NEW</span>' : ''}
        </div>
        <h1 class="detail-title">${threat.title}</h1>
        <div class="detail-fields">
          <div class="detail-field">
            <span class="field-key">Threat Name</span>
            <span class="field-value">${threat.threatName}</span>
          </div>
          <div class="detail-field">
            <span class="field-key">威胁评估步骤</span>
            <span class="field-value"><span class="layer-tag" style="--tag-color: ${catColor}">${threat.evaluationStep}</span></span>
          </div>
          <div class="detail-field">
            <span class="field-key">防护剧本</span>
            <div class="field-value">
              ${threat.playbookNames.map(name => {
                const m = name.match(/^P\s*(\d+)/) || name.match(/剧本\s*(\d+)/);
                const pbId = m ? 'P' + m[1] : '';
                return `<span class="src-tag playbook-link" data-nav="ai-agent-playbook" data-playbook-id="${pbId}" style="cursor:pointer">${name}</span>`;
              }).join(' ')}
            </div>
          </div>
          ${threat.owaspRelation.length > 0 ? `
          <div class="detail-field">
            <span class="field-key">OWASP Top 10 for LLM</span>
            <div class="field-value">
              ${threat.owaspRelation.map(o => `<span class="src-tag owasp-tag">${o}</span>`).join(' ')}
            </div>
          </div>` : ''}
          ${threat.agenticAiRelation.length > 0 ? `
          <div class="detail-field">
            <span class="field-key">OWASP Top 10 for Agentic AI</span>
            <div class="field-value">
              ${threat.agenticAiRelation.map(o => `<span class="src-tag agentic-ai-tag">${o}</span>`).join(' ')}
            </div>
          </div>` : ''}
        </div>
      </div>

      ${threat.description ? `
      <div class="detail-pane detail-pane-full" style="margin-top:24px">
        <div class="pane-header">
          <span class="pane-icon attack-icon">⟐</span>
          <h2>威胁描述 <span class="pane-title-en">Threat Description</span></h2>
          <span class="pane-line"></span>
        </div>
        <div class="pane-content prose">${threat.description}</div>
      </div>` : ''}

      ${threat.owaspBody ? `
      <div class="detail-pane detail-pane-full" style="margin-top:24px">
        <div class="pane-header">
          <span class="pane-icon" style="color:#facc15">⚠</span>
          <h2>与 OWASP Top 10 for LLM的关联 <span class="pane-title-en">OWASP Relation</span></h2>
          <span class="pane-line"></span>
        </div>
        <div class="pane-content prose">${threat.owaspBody}</div>
      </div>` : ''}

      ${threat.agenticAiBody ? `
      <div class="detail-pane detail-pane-full" style="margin-top:24px">
        <div class="pane-header">
          <span class="pane-icon" style="color:#a78bfa">⚠</span>
          <h2>与 OWASP Top 10 for Agentic AI的关联 <span class="pane-title-en">Agentic AI Relation</span></h2>
          <span class="pane-line"></span>
        </div>
        <div class="pane-content prose">${threat.agenticAiBody}</div>
      </div>` : ''}

      ${threat.attackScenarios ? `
      <div class="detail-pane detail-pane-full" style="margin-top:24px">
        <div class="pane-header">
          <span class="pane-icon attack-icon">⚡</span>
          <h2>攻击场景 <span class="pane-title-en">Attack Scenarios</span></h2>
          <span class="pane-line"></span>
        </div>
        <div class="pane-content prose attack-timeline">${threat.attackScenarios}</div>
      </div>` : ''}

      ${threat.mitigation ? `
      <div class="detail-pane detail-pane-full" style="margin-top:24px">
        <div class="pane-header">
          <span class="pane-icon shield-icon">◆</span>
          <h2>缓解方法 <span class="pane-title-en">Mitigation</span></h2>
          <span class="pane-line"></span>
        </div>
        <div class="pane-content prose">${threat.mitigation}</div>
      </div>` : ''}

      ${renderPrevNextNav(prevId, nextId)}
      ${renderFooter()}
    </main>`;
}

// ─── Playbook Detail Page ─────────────────────────────────────
function renderPlaybookPage(detail: PlaybookDetail, prevId: string | null, nextId: string | null): string {
  return `
    ${renderNavbar({ subProject: 'ai-agent' })}
    <main class="main-content">
      <div class="breadcrumb">
        <span class="bc-link" data-nav="ai-agent-home">AI Agent 威胁模型</span>
        <span class="bc-sep">/</span>
        <span class="bc-current">${detail.title}</span>
      </div>

      <div class="detail-header" style="--layer-color: #4ade80">
        <div class="detail-header-top">
          <code class="detail-id">${detail.playbookId}</code>
        </div>
        <h1 class="detail-title">${detail.title}</h1>
        <div class="detail-fields">
          <div class="detail-field">
            <span class="field-key">威胁评估步骤</span>
            <span class="field-value">${detail.evaluationStep}</span>
          </div>
          <div class="detail-field">
            <span class="field-key">关联威胁</span>
            <div class="field-value">
              ${detail.relatedThreats.map(name => {
                const tid = (name.match(/^T\d+/) || [])[0] || threatNameToId[name.replace(/^T\d+\s*[：:]\s*/, '').trim()];
                if (tid) {
                  return `<span class="src-tag playbook-link" data-nav="ai-agent-threat" data-id="${tid}" style="cursor:pointer">${name}</span>`;
                }
                return `<span class="src-tag">${name}</span>`;
              }).join(' ')}
            </div>
          </div>
        </div>
      </div>

      <div class="playbook-sections">
      ${detail.sections.map((s, i) => {
        if (!s.html) return '';
        const isFull = i === 0 || i === detail.sections.length - 1;
        return `<div class="${isFull ? 'detail-pane detail-pane-full' : 'detail-pane'}">
          <div class="pane-header">
            <span class="pane-icon shield-icon">◆</span>
            <h2>${s.title}</h2>
            <span class="pane-line"></span>
          </div>
          <div class="pane-content prose">${s.html}</div>
        </div>`;
      }).join('')}
      </div>

      ${renderPrevNextNav(prevId, nextId, 'playbook')}
      ${renderFooter()}
    </main>`;
}

function renderPrevNextNav(prevId: string | null, nextId: string | null, type: 'threat' | 'playbook' = 'threat'): string {
  const titleMap = type === 'threat' ? threatTitleMap : playbookTitleMap;
  const navTarget = type === 'threat' ? 'ai-agent-threat' : 'ai-agent-playbook';
  const dataAttr = type === 'threat' ? 'data-id' : 'data-playbook-id';
  const prevTitle = prevId ? titleMap[prevId] || '' : '';
  const nextTitle = nextId ? titleMap[nextId] || '' : '';
  return `
    <div class="prev-next-nav">
      <div class="prev-next-inner">
        ${prevId ? `
          <button class="pn-btn pn-prev" data-nav="${navTarget}" ${dataAttr}="${prevId}">
            <span class="pn-arrow">←</span>
            <span class="pn-label">${prevId}：${prevTitle}</span>
          </button>
        ` : '<div></div>'}
        ${nextId ? `
          <button class="pn-btn pn-next" data-nav="${navTarget}" ${dataAttr}="${nextId}">
            <span class="pn-label">${nextId}：${nextTitle}</span>
            <span class="pn-arrow">→</span>
          </button>
        ` : '<div></div>'}
      </div>
    </div>`;
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
    type: r.type === 'threat' ? r.id || 'T?' : 'PLAYBOOK',
    title: r.title,
    snippet: r.snippet,
    nav: r.type === 'threat' ? 'ai-agent-threat' : 'ai-agent-playbook',
    dataAttr: r.type === 'threat' ? `data-id="${r.id}"` : `data-playbook-id="${r.playbookId}"`,
  }));
  dropdown.innerHTML = renderSearchDropdown(items, searchQuery);
  wrapper.appendChild(dropdown);
}

// ─── Public render ───────────────────────────────────────────
export async function render(app: HTMLElement, route: Route): Promise<void> {
  await ensureTitleMap();

  if (route.page === 'ai-agent-home') {
    app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><span>LOADING AGENT THREATS...</span></div>';
    app.innerHTML = await renderListPage();
  } else if (route.page === 'ai-agent-threat') {
    app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><span>DECRYPTING THREAT DATA...</span></div>';
    const ids = await getTableOrderedThreatIds();
    const threat = await loadThreatDetail(route.threatId);
    if (!threat) {
      app.innerHTML = '<div class="loading-screen"><span>ERROR: THREAT NOT FOUND</span></div>';
      return;
    }
    const idx = ids.indexOf(threat.threatId);
    const prevId = idx > 0 ? ids[idx - 1] : null;
    const nextId = idx < ids.length - 1 ? ids[idx + 1] : null;
    app.innerHTML = renderThreatPage(threat, prevId, nextId);
  } else if (route.page === 'ai-agent-playbook') {
    app.innerHTML = '<div class="loading-screen"><div class="spinner"></div><span>LOADING PLAYBOOK...</span></div>';
    const pbIds = await getSortedPlaybookIds();
    const detail = await loadPlaybookDetail(route.playbookId);
    if (!detail) {
      app.innerHTML = '<div class="loading-screen"><span>ERROR: PLAYBOOK NOT FOUND</span></div>';
      return;
    }
    const idx = pbIds.indexOf(detail.playbookId);
    const prevId = idx > 0 ? pbIds[idx - 1] : null;
    const nextId = idx < pbIds.length - 1 ? pbIds[idx + 1] : null;
    app.innerHTML = renderPlaybookPage(detail, prevId, nextId);
  }

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) searchInput.addEventListener('input', handleSearchInput);
}
