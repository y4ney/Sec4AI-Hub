import { marked } from 'marked';

const mdCache = new Map<string, string>();

export async function fetchMarkdown(basePath: string, folder: string): Promise<string> {
  const key = `${basePath}/${folder}`;
  if (mdCache.has(key)) return mdCache.get(key)!;
  try {
    const resp = await fetch(`${basePath}/${encodeURIComponent(folder)}.md`);
    const text = await resp.text();
    mdCache.set(key, text);
    return text;
  } catch {
    return '';
  }
}

export function extractBody(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\s*\n*/, '').trim();
}

export function extractSection(body: string, heading: string): string {
  const lines = body.split('\n');
  let start = -1;
  let end = lines.length;
  let found = false;
  let foundLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,4})\s/);
    if (match && lines[i].includes(heading)) {
      foundLevel = match[1].length;
      start = i + 1;
      found = true;
      continue;
    }
    if (found) {
      const endMatch = lines[i].match(/^(#{1,4})\s/);
      if (endMatch && endMatch[1].length <= foundLevel && !lines[i].includes(heading)) {
        end = i;
        break;
      }
    }
  }
  if (start === -1) return '';
  return lines.slice(start, end).join('\n').trim();
}

export async function renderMarkdown(raw: string): Promise<string> {
  if (!raw) return '';
  return marked.parse(raw) as Promise<string>;
}
