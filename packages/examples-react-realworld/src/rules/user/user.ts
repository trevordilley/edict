import { User } from '../../types/user';
import { session } from '../session';

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

const userProfileConditions = conditions(({ following }) => ({
  ...publicUserConditions,
  following,
}));

export const insertUser = (user: User) => {
  insert({ User: { ...user } });
};

export const logoutUser = () => {
  retractByConditions('User', userConditions);
};

export const userRule = rule('User', () => ({
  User: userConditions,
})).enact();

export const publicUserRule = rule('Public User', () => ({
  $publicUser: publicUserConditions,
})).enact();

export const userProfileRule = rule('User Profile', () => ({
  $userProfile: userProfileConditions,
})).enact();

export const getUserProfile = (username: string) =>
  userProfileRule.query({
    $userProfile: {
      ids: [username],
    },
  })[0];

export const getUser = () => userRule.query()[0];
