let started = false;

export async function initMocks(): Promise<void> {
  if (started) return;
  if (typeof window === 'undefined') return;
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK !== 'true') return;

  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
  started = true;
  // eslint-disable-next-line no-console
  console.info('[MSW] Mock service worker activated.');
}
