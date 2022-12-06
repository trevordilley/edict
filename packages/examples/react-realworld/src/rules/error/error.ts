import { session } from '../session';

const { rule, insert } = session;

export const errorRule = rule('Errors', ({ errors }) => ({
  App: {
    errors,
  },
})).enact();

export const insertError = (errorObj: { [key: string]: string[] }) => {
  insert({ App: { errors: errorObj } });
};
