export function initBrowserRuntime(): void {
  const desktop = window.desktopWindow?.isDesktop === true;
  document.documentElement.classList.add(desktop ? 'native-runtime' : 'web-runtime');
  if (desktop) return;

  document.body.classList.add('web-runtime');
  let installPrompt: Event & { prompt?: () => Promise<void>; userChoice?: Promise<unknown> } | null = null;
  const installButton = document.querySelector<HTMLButtonElement>('#web-install-btn');
  const aboutButton = document.querySelector<HTMLButtonElement>('#web-about-btn');
  const networkState = document.querySelector<HTMLElement>('#web-network-state');

  const updateNetworkState = () => {
    document.body.classList.toggle('web-offline', !navigator.onLine);
    if (!networkState) return;
    networkState.setAttribute('aria-label', navigator.onLine ? '在线' : '离线：已缓存界面仍可打开，在线音乐服务暂不可用');
    networkState.title = navigator.onLine ? '在线' : '离线模式';
  };

  const ensureAboutDialog = (): HTMLDialogElement => {
    const existing = document.querySelector<HTMLDialogElement>('#lumaradio-about-dialog');
    if (existing) return existing;
    const dialog = document.createElement('dialog');
    dialog.id = 'lumaradio-about-dialog';
    dialog.setAttribute('aria-labelledby', 'lumaradio-about-title');
    dialog.innerHTML = `<div class="lumaradio-about-card"><button class="lumaradio-about-close" type="button" aria-label="关闭">×</button><img src="/icons/lumaradio.svg" alt="" width="72" height="72"><div class="lumaradio-about-kicker">WEB + MACOS</div><h2 id="lumaradio-about-title">LumaRadio</h2><p>Rocky 制作的沉浸式视觉音乐播放器。</p><p class="lumaradio-about-credit">独立的 GPL-3.0 开源项目，保留原作品的版权与设计致谢。</p></div>`;
    document.body.append(dialog);
    dialog.querySelector('.lumaradio-about-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    return dialog;
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    if (installButton) installButton.hidden = false;
  });
  installButton?.addEventListener('click', async () => {
    await installPrompt?.prompt?.();
    await installPrompt?.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
  aboutButton?.addEventListener('click', () => ensureAboutDialog().showModal());
  window.addEventListener('online', updateNetworkState);
  window.addEventListener('offline', updateNetworkState);
  updateNetworkState();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    navigator.serviceWorker.register('/generated/service-worker.js').catch((error: Error) => {
      console.warn('[LumaRadio] Service worker registration failed:', error.message);
    });
  }

  if (new URLSearchParams(location.search).get('action') === 'search') {
    setTimeout(() => document.querySelector<HTMLInputElement>('#search-input')?.focus(), 700);
  }
}
