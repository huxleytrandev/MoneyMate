import { randomUUID } from 'expo-crypto';
// Client-generated UUID prevents duplicate creation when the same request is retried.
export function createId() {
  return randomUUID();
}
