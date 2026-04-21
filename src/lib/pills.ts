export const priorityPill: Record<string, string> = {
  High: "bg-[var(--pill-red-bg)] text-[var(--pill-red-fg)]",
  Medium: "bg-[var(--pill-yellow-bg)] text-[var(--pill-yellow-fg)]",
  Low: "bg-[var(--pill-gray-bg)] text-[var(--pill-gray-fg)]",
};

export const priorityDot: Record<string, string> = {
  High: "🔴",
  Medium: "🟡",
  Low: "⚪",
};

export const statusPill: Record<string, string> = {
  "To Do": "bg-[var(--pill-gray-bg)] text-[var(--pill-gray-fg)]",
  "In Progress": "bg-[var(--pill-blue-bg)] text-[var(--pill-blue-fg)]",
  "Review": "bg-[var(--pill-purple-bg)] text-[var(--pill-purple-fg)]",
  "Done": "bg-[var(--pill-green-bg)] text-[var(--pill-green-fg)]",
};

export const typePill: Record<string, string> = {
  Daily: "bg-[var(--pill-blue-bg)] text-[var(--pill-blue-fg)]",
  Weekly: "bg-[var(--pill-purple-bg)] text-[var(--pill-purple-fg)]",
  Monthly: "bg-[var(--pill-pink-bg)] text-[var(--pill-pink-fg)]",
};

export const reimbStatusPill: Record<string, string> = {
  Pending: "bg-[var(--pill-yellow-bg)] text-[var(--pill-yellow-fg)]",
  Approved: "bg-[var(--pill-green-bg)] text-[var(--pill-green-fg)]",
  Rejected: "bg-[var(--pill-red-bg)] text-[var(--pill-red-fg)]",
};

export const blankSpotPill: Record<string, string> = {
  covered: "bg-[var(--pill-green-bg)] text-[var(--pill-green-fg)]",
  partial: "bg-[var(--pill-yellow-bg)] text-[var(--pill-yellow-fg)]",
  blank: "bg-[var(--pill-red-bg)] text-[var(--pill-red-fg)]",
};

export const STATUSES = ["To Do", "In Progress", "Review", "Done"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const TYPES = ["Daily", "Weekly", "Monthly"] as const;
