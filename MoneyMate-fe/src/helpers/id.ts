// Only call from user events; these IDs are for session-only demo data.
export function createDemoId() {
  return new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
}
