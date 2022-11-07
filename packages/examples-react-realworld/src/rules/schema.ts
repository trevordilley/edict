import { Article } from '../types/article';
import { User, UserSettings } from '../types/user';
import { Profile } from '../types/profile';
import { Comment } from '../types/comment';

export const ID = {
  ARTICLE: (article: Article) => article.slug,
  COMMENT: (id: number) => `comment${id}`,
  PROFILE: (profile: Profile) => profile.username,
} as const;

interface Error {
  errors: { [key: string]: string[] };
}

export const HOME_TAB = {
  GLOBAL_FEED: 'Global Feed',
  YOUR_FEED: 'Your Feed',
};
interface HomePage {
  selectedTab: string;
  tabNames: string[];
}

interface ArticleList {
  currentPage: number;
  offset: number;
  limit: number;
}

export enum FetchState {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export interface Fetch {
  fetchState: FetchState;
}

export type Schema = Article &
  ArticleList & {
    isSubmitting: boolean;
    submittingFavorite: FetchState;
    submittingFollow: FetchState;
    deletingArticle: FetchState;
    isFavoriting: FetchState;
    commentBody: string;
    submittingComment: FetchState;
    tag: string;
    filterByAuthor: string;
  } & Fetch &
  User & {
    isLoggingIn: FetchState;
  } & Error &
  Profile &
  UserSettings &
  Comment & { articleCount: number } & HomePage;
