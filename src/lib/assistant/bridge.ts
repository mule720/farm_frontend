import { useEffect } from 'react';

/**
 * Connects a shell to the AI guide. The shell says where the person is and does what the guide asks:
 *   usePageBridge(page, label, go)  - call once in each shell.
 * `go` receives a page id and must open it (ignore ids the shell does not have).
 */
export function usePageBridge(page: string, label: string | undefined, go: (page: string) => void) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('agri:page', { detail: { page, label } }));
  }, [page, label]);
  useEffect(() => {
    const h = (e: Event) => { const p = (e as CustomEvent).detail?.page; if (typeof p === 'string') go(p); };
    window.addEventListener('agri:navigate', h);
    return () => window.removeEventListener('agri:navigate', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go]);
}
