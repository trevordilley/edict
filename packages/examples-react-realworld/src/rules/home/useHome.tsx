import { useEffect, useState } from 'react';
import { homePageRule } from './home';

export const useHome = () => {
  const [
    {
      HomePage: { selectedTab, tabNames, currentPage },
      Tags: { tagList },
    },
    setHome,
  ] = useState(homePageRule.query()[0]);
  useEffect(() => {
    return homePageRule.subscribe((h) => setHome(h[0]));
  });
  return { selectedTab, tagList, tabNames, currentPage };
};
