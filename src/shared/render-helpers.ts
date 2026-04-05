export function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function getSeverityColor(sev: string): string {
  switch (sev) {
    case '严重': return '#ff0040';
    case '高危': return '#ff6b00';
    case '中危': return '#ffc800';
    case '低危': return '#00e676';
    default: return '#71717a';
  }
}

export function statBlock(val: number, key: string, cls: string, filter?: string, active?: boolean): string {
  const activeClass = active ? ' stat-block-active' : '';
  return `<div class="stat-block clickable${activeClass}" data-filter="${filter ?? ''}">
    <span class="stat-val ${cls}">${val}</span>
    <span class="stat-key">${key}</span>
  </div>`;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const re = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

interface SearchResultItem {
  type: string;
  title: string;
  snippet: string;
  nav: string;
  dataAttr: string;
}

export function renderSearchDropdown(results: SearchResultItem[], query: string): string {
  if (results.length > 0) {
    return results.map(r => {
      const snippetHtml = r.snippet ? `<div class="sr-snippet">${highlightMatch(r.snippet, query)}</div>` : '';
      return `<div class="search-result" data-nav="${r.nav}" ${r.dataAttr}>
        <div class="sr-main">
          <span class="sr-type">${r.type}</span>
          <span class="sr-title">${highlightMatch(r.title, query)}</span>
        </div>
        ${snippetHtml}
      </div>`;
    }).join('');
  }
  return '<div class="search-no-result">无匹配结果</div>';
}
