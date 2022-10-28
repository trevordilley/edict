import { Article } from '../types/article';
import { User, UserSettings } from '../types/user';
import { edict } from '@edict/core';
import { Profile } from '../types/profile';
import { Schema } from './schema';

export const session = edict<Schema>(true);

export const { insert, retract, retractByConditions, conditions, debug } =
  session;
