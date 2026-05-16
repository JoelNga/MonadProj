const sessions = new Map<string, { scanned: boolean; timestamp: number }>();

export function createSession(id: string) {
  sessions.set(id, { scanned: false, timestamp: Date.now() });
}

export function markScanned(id: string) {
  const session = sessions.get(id);
  if (session) {
    session.scanned = true;
    session.timestamp = Date.now();
  }
}

export function isScanned(id: string): boolean {
  return sessions.get(id)?.scanned ?? false;
}

export function cleanupOldSessions(maxAgeMs = 300000) {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.timestamp > maxAgeMs) {
      sessions.delete(id);
    }
  }
}