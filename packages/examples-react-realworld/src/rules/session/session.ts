import { session } from '../session';

export const sessionRule = session
  .rule('Session', ({ token, username }) => ({
    Session: {
      token,
      username,
    },
  }))
  .enact();
