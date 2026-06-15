// getUserInitials.ts — derive one- or two-letter initials from a display name or email.

export function getUserInitials(name: string | null, email: string | null): string {
  if (name !== null && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? '';
      const last = parts[parts.length - 1]?.[0] ?? '';
      return `${first}${last}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0] !== undefined && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }

  if (email !== null && email.trim().length >= 2) {
    return email.trim().slice(0, 2).toUpperCase();
  }

  return 'U';
}
