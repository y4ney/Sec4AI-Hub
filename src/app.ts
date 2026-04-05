import { pathToRoute, routeToPath, navigate, app, type Route } from './shared/router';
import { renderLanding, initLandingEffects } from './landing';
import { render as renderOpenClaw } from './openclaw/app';
import { render as renderAIAgent } from './ai-agent/app';

let currentRoute: Route = { page: 'landing' };

async function render() {
  switch (currentRoute.page) {
    case 'landing':
      app.innerHTML = renderLanding();
      initLandingEffects();
      break;
    case 'openclaw-home':
    case 'openclaw-threat':
    case 'openclaw-cli':
      await renderOpenClaw(app, currentRoute);
      break;
    case 'ai-agent-home':
    case 'ai-agent-threat':
    case 'ai-agent-playbook':
      await renderAIAgent(app, currentRoute);
      break;
  }
}

function handleGlobalClick(e: Event) {
  const target = (e.target as HTMLElement).closest('[data-nav]') as HTMLElement;
  if (!target) return;
  e.preventDefault();
  const nav = target.dataset.nav;

  if (nav === 'landing') navigate({ page: 'landing' });
  else if (nav === 'openclaw-home') navigate({ page: 'openclaw-home' });
  else if (nav === 'ai-agent-home') navigate({ page: 'ai-agent-home' });
  else if (nav === 'openclaw-threat') navigate({ page: 'openclaw-threat', threatId: target.dataset.id! });
  else if (nav === 'openclaw-cli') navigate({ page: 'openclaw-cli', folder: target.dataset.folder! });
  else if (nav === 'ai-agent-threat') navigate({ page: 'ai-agent-threat', threatId: target.dataset.id! });
  else if (nav === 'ai-agent-playbook') navigate({ page: 'ai-agent-playbook', playbookId: target.dataset.playbookId! });
}

export function start() {
  currentRoute = pathToRoute(window.location.pathname);
  history.replaceState(null, '', routeToPath(currentRoute));

  window.addEventListener('popstate', () => {
    currentRoute = pathToRoute(window.location.pathname);
    render();
  });

  // Global click delegation for all data-nav elements
  document.addEventListener('click', handleGlobalClick);

  // Close search dropdown on outside click
  document.addEventListener('click', (e) => {
    const wrapper = (e.target as HTMLElement).closest('.search-wrapper');
    if (!wrapper) {
      const dropdown = document.querySelector('.search-dropdown');
      if (dropdown) dropdown.remove();
    }
  });

  // Listen for route-change from sub-modules
  window.addEventListener('route-change', ((e: Event) => {
    currentRoute = (e as CustomEvent).detail as Route;
    render();
  }) as EventListener);

  render();
}
