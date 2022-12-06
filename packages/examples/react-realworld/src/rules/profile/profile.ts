import { Profile } from '../../types/profile';
import { session } from '../session';
import { ID } from '../schema';

const { rule, insert } = session;

export const insertProfile = (profile: Profile) => {
  insert({ [ID.PROFILE(profile)]: { ...profile } });
};
