import { Err, Ok, Result } from '@hqoss/monads';
import axios from 'axios';
import { array, guard, object, string } from 'decoders';
import settings from '../config/settings';
import {
  Article,
  articleDecoder,
  ArticleForEditor,
  ArticlesFilters,
  FeedFilters,
  MultipleArticles,
  multipleArticlesDecoder,
} from '../types/article';
import { ArticleComment, Comment, commentDecoder } from '../types/comment';
import { GenericErrors, genericErrorsDecoder } from '../types/error';
import { objectToQueryString } from '../types/object';
import { Profile, profileDecoder } from '../types/profile';
import {
  User,
  userDecoder,
  UserForRegistration,
  UserSettings,
} from '../types/user';

axios.defaults.baseURL = settings.baseApiUrl;
export const DEFAULT_FEED_LIMIT = 10;
export const INITIAL_FEED_OFFSET = 0;
export async function getArticles(
  filters: ArticlesFilters = {}
): Promise<MultipleArticles> {
  const finalFilters: ArticlesFilters = {
    limit: DEFAULT_FEED_LIMIT,
    offset: INITIAL_FEED_OFFSET,
    ...filters,
  };

  const decodedArticles = guard(multipleArticlesDecoder)(
    (await axios.get(`articles?${objectToQueryString(finalFilters)}`)).data
  );

  return decodedArticles;
}

export async function getTags(): Promise<{ tags: string[] }> {
  const tagsResults = guard(object({ tags: array(string) }))(
    (await axios.get('tags')).data
  );

  return tagsResults;
}

export async function login(
  email: string,
  password: string
): Promise<Result<User, GenericErrors>> {
  try {
    const { data } = await axios.post('users/login', {
      user: { email, password },
    });

    const userResult = guard(object({ user: userDecoder }))(data).user;

    return Ok(userResult);
  } catch ({ response: { data } }) {
    const error = guard(object({ errors: genericErrorsDecoder }))(data).errors;
    return Err(error);
  }
}

export async function getUser(): Promise<User> {
  const { data } = await axios.get('user');
  const user = guard(object({ user: userDecoder }))(data).user;

  return user;
}

export async function favoriteArticle(slug: string): Promise<Article> {
  const favoritedArticle = guard(object({ article: articleDecoder }))(
    (await axios.post(`articles/${slug}/favorite`)).data
  ).article;

  return favoritedArticle;
}

export async function unfavoriteArticle(slug: string): Promise<Article> {
  const unfavoritedArticle = guard(object({ article: articleDecoder }))(
    (await axios.delete(`articles/${slug}/favorite`)).data
  ).article;

  return unfavoritedArticle;
}

export async function updateSettings(
  user: UserSettings
): Promise<Result<User, GenericErrors>> {
  try {
    const { data } = await axios.put('user', { user });
    const decoded = guard(object({ user: userDecoder }))(data).user;

    return Ok(decoded);
  } catch ({ data }) {
    const err = guard(object({ errors: genericErrorsDecoder }))(data).errors;
    return Err(err);
  }
}

export async function signUp(
  user: UserForRegistration
): Promise<Result<User, GenericErrors>> {
  try {
    const { data } = await axios.post('users', { user });
    const decoded = guard(object({ user: userDecoder }))(data).user;
    return Ok(decoded);
  } catch ({ response: { data } }) {
    const err = guard(object({ errors: genericErrorsDecoder }))(data).errors;
    return Err(err);
  }
}

export async function createArticle(
  article: ArticleForEditor
): Promise<Result<Article, GenericErrors>> {
  try {
    const { data } = await axios.post('articles', { article });
    const decoded = guard(object({ article: articleDecoder }))(data).article;
    // example of typesafe api
    // session.$article(decoded.slug).insert(decoded);
    return Ok(decoded);
  } catch ({ response: { data } }) {
    const error = guard(object({ errors: genericErrorsDecoder }))(data).errors;
    return Err(error);
  }
}

export async function getArticle(slug: string): Promise<Article> {
  const { data } = await axios.get(`articles/${slug}`);

  const article = guard(object({ article: articleDecoder }))(data).article;

  return article;
}

export async function updateArticle(
  slug: string,
  article: ArticleForEditor
): Promise<Result<Article, GenericErrors>> {
  try {
    const { data } = await axios.put(`articles/${slug}`, { article });
    const updatedArticle = guard(object({ article: articleDecoder }))(
      data
    ).article;
    return Ok(updatedArticle);
  } catch ({ response: { data } }) {
    const err = guard(object({ errors: genericErrorsDecoder }))(data).errors;
    return Err(err);
  }
}

export async function getProfile(username: string): Promise<Profile> {
  const { data } = await axios.get(`profiles/${username}`);

  const profileData = guard(object({ profile: profileDecoder }))(data).profile;

  return profileData;
}

export async function followUser(username: string): Promise<Profile> {
  const { data } = await axios.post(`profiles/${username}/follow`);

  return guard(object({ profile: profileDecoder }))(data).profile;
}

export async function unfollowUser(username: string): Promise<Profile> {
  const { data } = await axios.delete(`profiles/${username}/follow`);

  return guard(object({ profile: profileDecoder }))(data).profile;
}

export async function getFeed(
  filters: FeedFilters = {}
): Promise<MultipleArticles> {
  const finalFilters: ArticlesFilters = {
    limit: 10,
    offset: 0,
    ...filters,
  };

  const articles = guard(multipleArticlesDecoder)(
    (await axios.get(`articles/feed?${objectToQueryString(finalFilters)}`)).data
  );

  return articles;
}

export async function getArticleComments(
  slug: string
): Promise<ArticleComment[]> {
  const { data } = await axios.get(`articles/${slug}/comments`);

  const comments = guard(object({ comments: array(commentDecoder) }))(
    data
  ).comments.map((c) => ({ ...c, slug }));

  return comments;
}

export async function deleteComment(
  slug: string,
  commentId: number
): Promise<void> {
  await axios.delete(`articles/${slug}/comments/${commentId}`);
}

export async function createComment(
  slug: string,
  body: string
): Promise<Comment> {
  const { data } = await axios.post(`articles/${slug}/comments`, {
    comment: { body },
  });

  const comment = guard(object({ comment: commentDecoder }))(data).comment;

  return comment;
}

export async function deleteArticle(slug: string): Promise<void> {
  await axios.delete(`articles/${slug}`);
}
