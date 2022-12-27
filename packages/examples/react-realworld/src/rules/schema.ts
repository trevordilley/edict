import { Article } from '../types/article'
import { User, UserSettings } from '../types/user'
import { Profile } from '../types/profile'
import { Comment } from '../types/comment'

export const ID = {
  ARTICLE: (article: Article) => article.slug,
  COMMENT: (id: number) => `comment${id}`,
  PROFILE: (profile: Profile) => profile.username,
} as const

interface Error {
  errors: { [key: string]: string[] }
}

export const HOME_TAB = {
  GLOBAL_FEED: 'Global Feed',
  YOUR_FEED: 'Your Feed',
}
interface HomePage {
  selectedTab: string
  tabNames: string[]
}

interface ArticleList {
  currentPage: number
  offset: number
  limit: number
}

export enum FetchState {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export interface Fetch {
  fetchState: FetchState
  isSubmitting: boolean
  submittingFavorite: FetchState
  submittingFollow: FetchState
  deletingArticle: FetchState
  isFavoriting: FetchState
  submittingComment: FetchState
  isLoggingIn: FetchState
}

type ArticleSchema = Article &
  ArticleList & {
    commentBody: string
    tag: string
    filterByAuthor: string
    articleCount: number
  }

export type Schema = ArticleSchema &
  Fetch &
  User &
  Error & { location: string } & Profile &
  UserSettings &
  Comment &
  HomePage
