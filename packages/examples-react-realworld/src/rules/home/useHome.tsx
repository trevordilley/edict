import { useEffect, useState } from 'react';
import { homePageRule } from './home';

export const useHome = () => {
  const [home, setHome] = useState(homePageRule.queryOne());
  useEffect(() => {
    return homePageRule.subscribeOne((h) => setHome(h));
  });
  return {
    selectedTab: home?.HomePage.selectedTab,
    tagList: home?.Tags.tagList,
    tabNames: home?.HomePage.tabNames,
    currentPage: home?.ArticleList.currentPage,
  };
};
