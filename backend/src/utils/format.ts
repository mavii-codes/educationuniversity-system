export function formatRelativeTime(value: Date | string | null | undefined): string {
  if (!value) return "Never";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;

  return date.toLocaleDateString();
}
