import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './app/app';
import { insert } from './rules/session';
import { FetchState, HOME_TAB } from './rules/schema';
import {
  DEFAULT_FEED_LIMIT,
  getUser,
  INITIAL_FEED_OFFSET,
} from './services/conduit';
import { HashRouter } from 'react-router-dom';
import { insertUser, setToken } from './rules/user/user';

insert({
  App: {
    token: undefined,
    username: undefined,
    errors: {},
  },
  Session: {
    token: undefined,
  },
  HomePage: {
    selectedTab: HOME_TAB.GLOBAL_FEED,
    tabNames: [HOME_TAB.GLOBAL_FEED],
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
});
const token = localStorage.getItem('token');
if (token) {
  setToken(token);
  getUser().then((u) => insertUser(u));
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
