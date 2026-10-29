import { useRef } from 'react';
export function useDirtyFields(values: unknown) {
  const initial = useRef(JSON.stringify(values));
  return initial.current !== JSON.stringify(values);
}
