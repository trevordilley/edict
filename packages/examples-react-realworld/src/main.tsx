import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './app/app';
import { insert } from './rules/session';
import { FetchState, HOME_TAB } from './rules/schema';
import { DEFAULT_FEED_LIMIT, INITIAL_FEED_OFFSET } from './services/conduit';
import { HashRouter } from 'react-router-dom';
import axios from 'axios';

insert({
  HomePage: {
    selectedTab: HOME_TAB.GLOBAL_FEED,
    tabNames: [],
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
  CurrentComment: {
    commentBody: '',
    submittingComment: FetchState.DONE,
  },
  Tags: {
    tagList: [],
  },
  Error: {
    errors: {},
  },
});
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.Authorization = `Token ${token}`;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
