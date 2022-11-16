import { session } from '../session';

export const sessionRule = session
  .rule('Session', ({ token }) => ({
    Session: {
      token,
    },
  }))
  .enact();
