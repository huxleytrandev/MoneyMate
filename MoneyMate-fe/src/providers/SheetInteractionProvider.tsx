import { createContext, type PropsWithChildren } from 'react';
export const SheetBusyContext = createContext(false);
export function SheetInteractionProvider({ busy, children }: PropsWithChildren<{ busy: boolean }>) {
  return <SheetBusyContext.Provider value={busy}>{children}</SheetBusyContext.Provider>;
}
