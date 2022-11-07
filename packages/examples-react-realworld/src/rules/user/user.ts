import { User } from '../../types/user';
import { session } from '../session';
import { FetchState } from '../schema';
import { followUser, unfollowUser } from '../../services/conduit';

const { insert, rule, conditions, retract, retractByConditions } = session;

const publicUserConditions = conditions(({ username, image, bio }) => ({
  username,
  image,
  bio,
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
