// getUserInitials.test.ts — initials helper for the account avatar menu.

import { describe, expect, it } from 'vitest';
import { getUserInitials } from './getUserInitials';

describe('getUserInitials', () => {
  it('uses first and last name initials', () => {
    expect(getUserInitials('Johan Pulido', 'jopulido3@hotmail.com')).toBe('JP');
  });

  it('falls back to email when name is missing', () => {
    expect(getUserInitials(null, 'jopulido3@hotmail.com')).toBe('JO');
  });
});
