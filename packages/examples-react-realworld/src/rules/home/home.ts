import { session } from '../session';
import { getArticles, getFeed } from '../../services/conduit';
import { resetArticles } from '../article/article';

const { insert, rule } = session;

// =================== \\
// Rules               \\
// =================== \\
rule(
  'Derive available tabs based on selection and login state',
  ({ token, selectedTab }) => ({
    User: {
      token,
    },
    HomePage: {
      selectedTab,
    },
  })
).enact({
  then: ({ User: { token }, HomePage: { selectedTab } }) => {
    const tabNames = Array.from(
      new Set([...(token ? ['Your Feed'] : []), 'Global Feed', selectedTab])
    );
    insert({
      HomePage: {
        tabNames,
      },
    });
  },
});

rule(
  'Changing the page or limit updates the offset',
  ({ currentPage, limit }) => ({
    HomePage: {
      currentPage,
      limit,
    },
  })
).enact({
  then: ({ HomePage: { currentPage, limit } }) => {
    insert({
      HomePage: {
        offset: (currentPage - 1) * limit,
      },
    });
  },
});

rule(
  'changes to page filters refetches articles',
  ({ selectedTab, offset, limit }) => ({
    HomePage: {
      selectedTab,
      offset,
      limit,
    },
  })
).enact({
  then: async ({ HomePage: { selectedTab, offset, limit } }) => {
    const filters = {
      offset,
      limit,
    };

    const finalFilters = {
      ...filters,
      tag: selectedTab.slice(2),
    };

    resetArticles();
    const fetchArticles = selectedTab === 'Your Feed' ? getFeed : getArticles;
    await fetchArticles(!selectedTab.startsWith('#') ? filters : finalFilters);
  },
});

// =================== \\
// Queries             \\
// =================== \\
export const homePageRule = rule(
  'Home page',
  ({ selectedTab, tagList, tabNames, currentPage }) => ({
    HomePage: {
      selectedTab,
      tabNames,
      currentPage,
    },
    Tags: {
      tagList,
    },
  })
).enact();

// =================== \\
// Insert/Retracts     \\
// =================== \\
export const changeHomeTab = (tab: string) =>
  insert({
    HomePage: {
      selectedTab: tab,
    },
  });
