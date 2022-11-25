import { User } from '../../types/user';
import { session } from '../session';
import { FetchState, HOME_TAB } from '../schema';
import {
  followUser,
  login,
  signUp,
  unfollowUser,
  updateSettings,
} from '../../services/conduit';
import axios from 'axios';
import { insertError } from '../error/error';
import * as decodeJwt from 'jwt-decode';

const { insert, rule, conditions, retract, retractByConditions } = session;
const publicUserConditions = conditions(({ username, image, bio }) => ({
  username,
  image,
  bio,
}));

export const userSettingsConditions = conditions(({ email, password }) => ({
  ...publicUserConditions,
  email,
  password,
}));

const userConditions = conditions(({ email, token }) => ({
  ...publicUserConditions,
  email,
}));

const userProfileConditions = conditions(({ following, isSubmitting }) => ({
  ...publicUserConditions,
  following,
  isSubmitting,
}));

export const insertUser = (
  user: User,
  isSubmitting?: boolean,
  following?: boolean
) => {
  insert({
    [user.username]: {
      ...user,
      isSubmitting: isSubmitting ?? false,
      following: following ?? false,
    },
  });
};

rule('Update following status', ({ following, username, token }) => ({
  $user: {
    fetchState: { match: FetchState.QUEUED },
    following,
  },
  Session: {
    token,
  },
})).enact({
  then: ({ $user: { id, following }, Session: { token } }) => {
    if (!token) {
      windowRedirect('register');
      return;
    }
    const toggledFollow = !following;
    insert({
      [id]: {
        fetchState: FetchState.SENT,
        following: toggledFollow,
      },
    });

    (following ? unfollowUser : followUser)(id).then((result) => {
      insert({
        [id]: {
          fetchState: FetchState.DONE,
          following: result.following,
        },
      });
    });
  },
});

rule(
  'Setting a token persists the token, and sets the headers for axios',
  ({ token }) => ({
    Session: {
      token,
    },
  })
).enact({
  when: ({ Session: { token } }) => token !== undefined,
  then: async ({ Session: { token } }) => {
    if (!token)
      throw new Error('Token should never be undefined in this rule!');
    const decoded = decodeJwt.default<{ username: string }>(token);
    localStorage.setItem('token', token);

    axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    insert({
      Session: {
        username: decoded.username,
      },
    });
  },
});

export const setToken = (token?: string) => {
  insert({
    Session: {
      token,
    },
  });
};

export const loginRule = rule(
  'Successful Login using email and password loads the user',
  ({ email, password }) => ({
    Login: {
      email,
      password,
    },
  })
).enact({
  then: async ({ Login: { email, password } }) => {
    const result = await login(email, password!);
    retract('Login', 'email', 'password');
    result.match({
      ok: (user) => {
        setToken(user.token);
        insertUser(user);
        windowRedirect('#/');
      },
      err: (e) => insertError(e),
    });
  },
});

export const startRegistrationRule = rule(
  'Starting registration',
  ({ email, password, username }) => ({
    StartRegistration: {
      email,
      password,
      username,
    },
  })
).enact({
  then: async ({ StartRegistration: { email, password, username } }) => {
    const result = await signUp({
      username,
      email,
      password: password ?? '',
    });
    retract('StartRegistration', 'email', 'password', 'username');
    result.match({
      err: (e) => {
        insertError(e);
      },
      ok: (user) => {
        setToken(user.token);
        insertUser(user);
        windowRedirect('#/');
      },
    });
  },
});

/*
// rewritten using new typesafe syntax

export const startRegistrationRule = rule(
  'Starting registration',
  ({StartRegistration: { email, password, username }}) => ({
    StartRegistration: {
      email,
      password,
      username,
    },
  })
).enact({
  then: async ({ StartRegistration: { email, password, username } }) => {
    const result = await signUp({
      username,
      email,
      password: password ?? '',
    });
    session.StartRegistration.retract.email()
    session.StartRegistration.retract.password()
    session.StartRegistration.retract.username()
    result.match({
      err: (e) => {
        insertError(e);
      },
      ok: (user) => {
        session.Session.insert({
          token: user.token,
          username: user.username
        })
        session.$user(user.username).insert(user)
        windowRedirect('#/');
      },
    });
  },
});



export const updateSettingsRule = rule(
  'Update users information when it changes ',
  ($user) => ({
    $user,
    Session: {
      username: { join: '$user' },
    },
    SettingsPage: {
      fetchState: { match: FetchState.QUEUED },
    },
  })
).enact({
  then: async ({ $user }) => {
    session.SettingsPage.insert({
        fetchState: FetchState.SENT,
      })
    const result = await updateSettings($user);
    result.match({
      err: (e) => insertError(e),
      ok: (user) => {
        setToken(user.token);
        session.$user(user.username).insert(user)
        session.SettingsPage.insert({
            fetchState: FetchState.DONE,
          })
      },
    });
  },
});
 */

export const updateSettingsRule = rule(
  'Update users information when it changes ',
  ({ username, password, image, bio, email, token }) => ({
    $user: {
      username,
      password,
      image,
      bio,
      email,
    },
    Session: {
      username: { join: '$user' },
    },
    SettingsPage: {
      fetchState: { match: FetchState.QUEUED },
    },
  })
).enact({
  then: async ({ $user }) => {
    insert({
      SettingsPage: {
        fetchState: FetchState.SENT,
      },
    });
    const result = await updateSettings($user);
    result.match({
      err: (e) => insertError(e),
      ok: (user) => {
        setToken(user.token);
        insertUser(user);
        insert({
          SettingsPage: {
            fetchState: FetchState.DONE,
          },
        });
      },
    });
  },
});

rule(
  'When the auth token is set to undefined, logout the user',
  ({ token }) => ({
    Session: {
      token,
      username: { then: false },
    },
  })
).enact({
  when: ({ Session: { token } }) => token === undefined,
  then: ({ Session: { username } }) => {
    /*
      session.$user(username).retract.all()
      session.HomePage.insert({
        tabNames: [HOME_TAB.GLOBAL_FEED],
        selectedTab: HOME_TAB.GLOBAL_FEED,
      })
      session.Session.insert({
        username: undefined
        })
     */
    retractByConditions(username, userConditions);
    insert({
      HomePage: {
        tabNames: [HOME_TAB.GLOBAL_FEED],
        selectedTab: HOME_TAB.GLOBAL_FEED,
      },
      Session: {
        username: undefined,
      },
    });
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    windowRedirect('/');
  },
});

export const windowRedirect = (location: string) => {
  // session.Page.insert({location})
  insert({
    Page: {
      location,
    },
  });
};

rule('Redirect when location changes', ({ location }) => ({
  Page: {
    location,
  },
})).enact({
  then: ({ Page: { location } }) => {
    window.location.hash = location;
  },
});

export const userRule = rule('User', () => ({
  $user: userConditions,
})).enact();

/*
  playing with typesafe api examples
export const userProfileRule = rule('User Profile', ({$userProfile}) => ({
  $userProfile,
})).enact();

 */

export const userProfileRule = rule('User Profile', () => ({
  $userProfile: userProfileConditions,
})).enact();

export const followingUsersRule = rule(
  'Authors the user follows',
  ({ following, username }) => ({
    $following: {
      following,
      username,
    },
  })
).enact();

export const startLogin = (email: string, password: string) => {
  insert({
    Login: {
      email,
      password,
    },
  });
};
