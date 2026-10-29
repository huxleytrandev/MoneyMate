import { useContext } from 'react';
import { SheetBusyContext } from '@/providers/SheetInteractionProvider';
export function useSheetBusy() {
  return useContext(SheetBusyContext);
}
