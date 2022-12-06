import { session } from '../session';
import { FetchState } from '../schema';
import { getTags } from '../../services/conduit';

const { insert, rule } = session;

export const insertAllTags = (tags: string[]) => {
  insert({
    Tags: {
      tagList: tags,
    },
  });
};

rule('Fetch Tags', ({ fetchState }) => ({
  Tags: {
    fetchState: { match: FetchState.QUEUED },
  },
})).enact({
  then: () => {
    insert({
      Tags: {
        fetchState: FetchState.SENT,
      },
    });
    loadTagsIntoSession().then(() => {
      insert({
        Tags: {
          fetchState: FetchState.DONE,
        },
      });
    });
  },
});

export const tagList = rule('Tag List', ({ tagList }) => ({
  Tags: {
    tagList,
  },
})).enact();

export const loadTagsIntoSession = async () => {
  const tags = await getTags();
  insertAllTags(tags.tags);
};
