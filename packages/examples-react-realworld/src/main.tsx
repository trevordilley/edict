import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './app/app';
import { insert } from './rules/session';
import { HOME_TAB } from './rules/schema';
import { DEFAULT_FEED_LIMIT, INITIAL_FEED_OFFSET } from './services/conduit';

insert({
  HomePage: {
    selectedTab: HOME_TAB.GLOBAL_FEED,
  },
  ArticleList: {
    limit: DEFAULT_FEED_LIMIT,
    offset: INITIAL_FEED_OFFSET,
    currentPage: 1,
    filterByAuthor: undefined,
    tag: undefined,
    favorited: undefined,
    articleCount: 0,
  },
  Tags: {
    tagList: [],
  },
  Error: {
    errors: {},
  },
});
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
