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
          <a href="https://github.com/y4ney/Sec4AI-Hub" target="_blank" rel="noopener noreferrer" class="github-corner" title="View on GitHub" aria-label="View source on GitHub">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor" class="github-icon">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </a>
          </div>
      </div>
    </nav>`;
}
