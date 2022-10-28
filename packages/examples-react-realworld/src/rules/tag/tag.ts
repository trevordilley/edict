import { session } from '../session';

const { insert, rule } = session;

export const insertAllTags = (tags: string[]) => {
  insert({
    Tags: {
      tagList: tags,
    },
  });
};
