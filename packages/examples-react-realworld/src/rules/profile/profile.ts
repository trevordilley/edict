import { Profile } from '../../types/profile';
import { session } from '../session';
import { ID } from '../schema';

const { insert } = session;

// TODO: Handle undefined state for login/logout/etc. so we can enforce rules based on login state

export const insertProfile = (profile: Profile) => {
  insert({ [ID.PROFILE(profile)]: { ...profile } });
};
