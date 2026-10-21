'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Kind = 'ok' | 'error' | 'info';
interface Toast {
  id: number;
  text: string;
  kind: Kind;
}

const Ctx = createContext<((text: string, kind?: Kind) => void) | null>(null);

/**
 * Pesan singkat di bawah layar. role="status" untuk kabar biasa dan
 * role="alert" untuk galat, supaya pembaca layar ikut membacakannya.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const n = useRef(0);

  const show = useCallback((text: string, kind: Kind = 'ok') => {
    const id = ++n.current;
    setList((l) => [...l.slice(-2), { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === 'error' ? 5200 : 2600);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="ui-toasts">
        {list.map((t) => (
          <div key={t.id} className={`ui-toast ui-toast-${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast harus dipakai di dalam <ToastProvider>.');
  return c;
}
