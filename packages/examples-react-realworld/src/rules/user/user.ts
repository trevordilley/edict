import { User } from '../../types/user';
import { session } from '../session';
import { FetchState } from '../schema';
import { followUser, signUp, unfollowUser } from '../../services/conduit';
import axios from 'axios';
import { insertError } from '../error/error';

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
  token,
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

export const logoutUser = () => {
  retractByConditions('User', userConditions);
};

rule('Update following status', ({ following, fetchState, username }) => ({
  $user: {
    username,
    fetchState: { match: FetchState.QUEUED },
    following,
  },
})).enact({
  then: ({ $user: { username, following } }) => {
    insert({
      [username]: {
        fetchState: FetchState.QUEUED,
      },
    });

    (following ? unfollowUser : followUser)(username).then(() => {
      insert({
        [username]: {
          fetchState: FetchState.DONE,
        },
      });
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
  then: ({ StartRegistration: { email, password, username } }) => {
    signUp({
      username,
      email,
      password: password ?? '',
    }).then((result) => {
      retract('StartRegistration', 'email', 'password', 'username');
      result.match({
        err: (e) => {
          insertError(e);
        },
        ok: (user) => {
          //TODO: I guess there currently isn't email validation?
          window.location.hash = '#/';
          insert({
            LoadUser: user,
          });
        },
      });
    });
  },
});

rule('Load user', () => ({
  LoadUser: {
    ...userConditions,
  },
})).enact({
  then: ({ LoadUser }) => {
    localStorage.setItem('token', LoadUser.token);
    axios.defaults.headers.Authorization = `Token ${LoadUser.token}`;
    const { id, ...user } = LoadUser;
    insert({
      [user.username]: user,
    });
  },
});

export const userRule = rule('User', () => ({
  $user: userConditions,
})).enact();

export const publicUserRule = rule('Public User', () => ({
  $publicUser: publicUserConditions,
})).enact();

export const userProfileRule = rule('User Profile', () => ({
  $userProfile: userProfileConditions,
})).enact();

export const getUserProfile = (username: string) =>
  userProfileRule.queryOne({
    $userProfile: {
      ids: [username],
    },
  });

export const getUser = () => userRule.queryOne();
