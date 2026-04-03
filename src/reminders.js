// Simple localStorage-backed reminders store
const STORAGE_KEY = "lifekeep_reminders";

export function getReminders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

export function saveReminder(reminder) {
  const all = getReminders();
  reminder.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  reminder.createdAt = new Date().toISOString();
  all.push(reminder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return reminder;
}

export function removeReminder(id) {
  const all = getReminders().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function markDone(id) {
  const all = getReminders().map(r => {
    if (r.id === id) {
      return { ...r, lastDone: new Date().toISOString(), completions: (r.completions || 0) + 1 };
    }
    return r;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearAllReminders() {
  localStorage.removeItem(STORAGE_KEY);
}

// Parse interval string like "Every 3 months" or "Annually" into days
export function intervalToDays(interval) {
  if (!interval) return 90;
  const lower = interval.toLowerCase();
  const numMatch = lower.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1]) : 1;

  if (lower.includes("week")) return num * 7;
  if (lower.includes("month")) return num * 30;
  if (lower.includes("year") || lower.includes("annual")) return num * 365;
  if (lower.includes("hour")) return 30; // usage-based, default 30 days
  if (lower.includes("season")) return 90;
  return 90; // default
}

export function getNextDueDate(reminder) {
  const lastDone = reminder.lastDone ? new Date(reminder.lastDone) : new Date(reminder.createdAt);
  const days = intervalToDays(reminder.interval);
  const next = new Date(lastDone);
  next.setDate(next.getDate() + days);
  return next;
}

export function getDaysUntilDue(reminder) {
  const next = getNextDueDate(reminder);
  const now = new Date();
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24));
}

export function getStatus(reminder) {
  const days = getDaysUntilDue(reminder);
  if (days < 0) return { label: "Overdue", color: "#C44B3F", bg: "#FDF0EE", days };
  if (days <= 14) return { label: "Due Soon", color: "#D4932A", bg: "#FDF6E8", days };
  return { label: "On Track", color: "#2D5A3D", bg: "#E8F0EA", days };
}
