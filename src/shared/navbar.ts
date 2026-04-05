import { escapeAttr } from './render-helpers';

interface NavbarOptions {
  subProject?: 'openclaw' | 'ai-agent';
  searchPlaceholder?: string;
  searchValue?: string;
}

export function renderNavbar(opts: NavbarOptions = {}): string {
  const sub = opts.subProject;
  const breadcrumb = sub
    ? `<span class="bc-sep" style="opacity:0.3;margin:0 8px">/</span>
       <span class="nav-crumb" data-nav="${sub === 'openclaw' ? 'openclaw-home' : 'ai-agent-home'}" style="cursor:pointer;color:var(--text-muted);font-family:var(--font-mono);font-size:12px;transition:color 0.2s">
         ${sub === 'openclaw' ? 'OpenClaw' : 'AI Agent'}
       </span>`
    : '';

  const searchHtml = `
    <div class="nav-center">
      <div class="search-wrapper">
        <input type="text" class="search-input" placeholder="${escapeAttr(opts.searchPlaceholder || 'Search...')}" value="${escapeAttr(opts.searchValue || '')}" id="search-input" />
        <span class="search-icon">⌕</span>
      </div>
    </div>`;

  const menuActive = sub ? 'nav-menu-trigger active' : 'nav-menu-trigger';

  return `
    <nav class="navbar">
      <div class="navbar-inner">
        <a class="navbar-brand" data-nav="landing">
          <img src="/favicon.svg" alt="" class="brand-logo" />
          <span class="brand-glitch">Sec4AI Hub</span>
          ${breadcrumb}
        </a>
        <div class="${menuActive}">
          <span class="nav-menu-label">Threat Model ▾</span>
          <div class="nav-menu-dropdown">
            <div class="nav-menu-item ${sub === 'openclaw' ? 'current' : ''}" data-nav="openclaw-home">
              <span class="nav-menu-title">OpenClaw</span>
            </div>
            <div class="nav-menu-item ${sub === 'ai-agent' ? 'current' : ''}" data-nav="ai-agent-home">
              <span class="nav-menu-title">AI Agent</span>
            </div>
          </div>
        </div>
        ${searchHtml}
        <div class="nav-right">
          <span class="terminal-prompt">root@security-for-ai:~$</span>
          <span class="blink-cursor">█</span>
          </div>
      </div>
    </nav>`;
}
