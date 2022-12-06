import { session } from '../session';
import { HOME_TAB } from '../schema';

const { insert, rule } = session;
// =================== \\
// Rules               \\
// =================== \\
rule(
  'Derive available tabs based on selection and login state',
  ({ token, selectedTab }) => ({
    Session: {
      token,
    },
    HomePage: {
      selectedTab,
    },
  })
).enact({
  then: ({ Session: { token }, HomePage: { selectedTab } }) => {
    const tabs = new Set([
      HOME_TAB.GLOBAL_FEED,
      ...(token !== undefined ? [HOME_TAB.YOUR_FEED, selectedTab] : []),
    ]);
    insert({
      HomePage: {
        tabNames: [...tabs],
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
