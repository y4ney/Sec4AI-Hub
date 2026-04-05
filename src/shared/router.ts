export type Route =
  | { page: 'landing' }
  | { page: 'openclaw-home' }
  | { page: 'openclaw-threat'; threatId: string }
  | { page: 'openclaw-cli'; folder: string }
  | { page: 'ai-agent-home' }
  | { page: 'ai-agent-threat'; threatId: string }
  | { page: 'ai-agent-playbook'; playbookId: string };

export function routeToPath(route: Route): string {
  switch (route.page) {
    case 'landing': return '/';
    case 'openclaw-home': return '/openclaw';
    case 'openclaw-threat': return `/openclaw/${route.threatId}`;
    case 'openclaw-cli': return `/openclaw/cli/${encodeURIComponent(route.folder)}`;
    case 'ai-agent-home': return '/ai-agent';
    case 'ai-agent-threat': return `/ai-agent/${encodeURIComponent(route.threatId)}`;
    case 'ai-agent-playbook': return `/ai-agent/playbook/${encodeURIComponent(route.playbookId)}`;
  }
}

export function pathToRoute(pathname: string): Route {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/' || path === '') return { page: 'landing' };
  if (path === '/openclaw') return { page: 'openclaw-home' };

  const ocThreat = path.match(/^\/openclaw\/([A-Z]+-\d+)$/);
  if (ocThreat) return { page: 'openclaw-threat', threatId: ocThreat[1] };

  const ocCli = path.match(/^\/openclaw\/cli\/(.+)$/);
  if (ocCli) return { page: 'openclaw-cli', folder: decodeURIComponent(ocCli[1]) };

  if (path === '/ai-agent') return { page: 'ai-agent-home' };

  const aaThreat = path.match(/^\/ai-agent\/(T\d+)$/);
  if (aaThreat) return { page: 'ai-agent-threat', threatId: aaThreat[1] };

  const aaPlaybook = path.match(/^\/ai-agent\/playbook\/(.+)$/);
  if (aaPlaybook) return { page: 'ai-agent-playbook', playbookId: decodeURIComponent(aaPlaybook[1]) };

  return { page: 'landing' };
}

const app = document.getElementById('app')!;

export function navigate(route: Route, replace = false) {
  const path = routeToPath(route);
  if (replace) history.replaceState(null, '', path);
  else history.pushState(null, '', path);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Dispatch custom event so top-level app.ts can re-render
  window.dispatchEvent(new CustomEvent('route-change', { detail: route }));
}

export { app };
