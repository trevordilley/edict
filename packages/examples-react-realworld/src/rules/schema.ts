import { Article } from '../types/article';
import { User, UserSettings } from '../types/user';
import { Profile } from '../types/profile';

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
  currentPage: number;
  offset: number;
  limit: number;
}

export type Schema = Article & { isSubmitting: boolean } & User &
  Error &
  Profile &
  UserSettings &
  Comment & { articleCount: number } & HomePage;
