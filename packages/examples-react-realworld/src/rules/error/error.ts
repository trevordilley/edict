import { session } from '../session';

const { rule, insert } = session;

export const errorRule = rule('Errors', ({ errors }) => ({
  Error: {
    errors,
  },
})).enact();

export const insertError = (errorObj: { [key: string]: string[] }) => {
  insert({ Error: { errors: errorObj } });
};
