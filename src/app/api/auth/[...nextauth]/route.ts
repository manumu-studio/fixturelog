// Auth.js catch-all route handler. Must stay public (no auth middleware/rate-limit).
import { handlers } from '@/features/auth/auth';

export const { GET, POST } = handlers;
