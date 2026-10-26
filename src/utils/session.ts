export function generateSessionId(prefix: string = 'TIS-2026'): string {
  const seq = String(nextSequence()).padStart(6, '0');
  return `${prefix}-${seq}`;
}

let counter = 0;
function nextSequence(): number {
  counter += 1;
  return counter;
}

export function resetSequence(): void {
  counter = 0;
}

export function formatElapsedTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowISO(): string {
  return new Date().toISOString();
}
