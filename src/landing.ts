import { renderNavbar } from './shared/navbar';
import { renderFooter } from './shared/footer';
import { search } from './ai-agent/data';
import { search as searchOC } from './openclaw/data';
import type { SearchResult as AISearchResult } from './ai-agent/data';
import { renderSearchDropdown } from './shared/render-helpers';

export function renderLanding(): string {
  return `
    ${renderNavbar({ searchPlaceholder: 'Search...' })}
    <main class="main-content">
      <div class="landing-hero">
        <img src="/favicon.svg" alt="Sec4AI" class="landing-logo" />
        <div class="sys-badge">SYS::SEC_HUB v2.0</div>
        <h1 class="page-title typewriter-target">
          <span class="title-bracket">[</span><span class="typewriter-text"></span><span class="typewriter-cursor">|</span><span class="title-bracket">]</span>
        </h1>
      </div>
      ${renderFooter()}
    </main>`;
}

export function initLandingEffects(): void {
  // Typewriter effect
  const el = document.querySelector('.typewriter-text') as HTMLElement | null;
  if (!el) return;
  const fullText = ' Sec4AI Hub';
  let idx = 0;
  el.textContent = '';
  const timer = setInterval(() => {
    if (idx < fullText.length) {
      el.textContent += fullText[idx];
      idx++;
    } else {
      clearInterval(timer);
    }
  }, 100);

  // Global search
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (!searchInput) return;
  searchInput.addEventListener('input', async (e) => {
    const query = (e.target as HTMLInputElement).value;
    const wrapper = document.querySelector('.search-wrapper');
    if (!wrapper) return;
    let existing = wrapper.querySelector('.search-dropdown');
    if (existing) existing.remove();
    if (!query.trim()) return;

    const [aiResults, ocResults] = await Promise.all([search(query), searchOC(query)]);
    const items = [
      ...ocResults.map(r => ({
        type: r.type === 'threat' ? r.id || 'OC' : 'CLI',
        title: r.title,
        snippet: r.snippet,
        nav: r.type === 'threat' ? 'openclaw-threat' : 'openclaw-cli',
        dataAttr: r.type === 'threat' ? `data-id="${r.id}"` : `data-folder="${r.folder}"`,
      })),
      ...aiResults.map(r => ({
        type: r.type === 'threat' ? r.id || 'T?' : 'PB',
        title: r.title,
        snippet: (r as AISearchResult).snippet || '',
        nav: r.type === 'threat' ? 'ai-agent-threat' : 'ai-agent-playbook',
        dataAttr: r.type === 'threat' ? `data-id="${r.id}"` : `data-playbook-id="${(r as AISearchResult).playbookId}"`,
      })),
    ];

    const dropdown = document.createElement('div');
    dropdown.className = 'search-dropdown';
    dropdown.innerHTML = renderSearchDropdown(items, query);
    wrapper.appendChild(dropdown);
  });
}
