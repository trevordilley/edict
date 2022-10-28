import { session } from '../session';

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

// =================== \\
// Queries             \\
// =================== \\
export const homePageRule = rule(
  'Home page',
  ({ selectedTab, tagList, tabNames, currentPage }) => ({
    HomePage: {
      selectedTab,
      tabNames,
    },
    ArticleList: {
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
