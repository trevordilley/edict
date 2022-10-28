import { Err, Ok, Result } from '@hqoss/monads';
import axios from 'axios';
import { array, guard, object, string } from 'decoders';
import settings from '../config/settings';
import { session } from '../rules/session';
import {
  Article,
  articleDecoder,
  ArticleForEditor,
  ArticlesFilters,
  FeedFilters,
  MultipleArticles,
  multipleArticlesDecoder,
} from '../types/article';
import { Comment, commentDecoder } from '../types/comment';
import { GenericErrors, genericErrorsDecoder } from '../types/error';
import { objectToQueryString } from '../types/object';
import { Profile, profileDecoder } from '../types/profile';
import {
  User,
  userDecoder,
  UserForRegistration,
  UserSettings,
} from '../types/user';
import {
  insertArticle,
  insertArticleCount,
  retractArticle,
} from '../rules/article/article';
import { insertAllTags } from '../rules/tag/tag';
import { insertUser } from '../rules/user/user';
import { insertError } from '../rules/error/error';
import { insertProfile } from '../rules/profile/profile';
import { insertComments, retractComment } from '../rules/comment/comment';

const { insert } = session;

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

  decodedArticles.articles.forEach((a) => insertArticle(a));
  insertArticleCount(decodedArticles.articlesCount);
  return decodedArticles;
}

export async function getTags(): Promise<{ tags: string[] }> {
  const tagsResults = guard(object({ tags: array(string) }))(
    (await axios.get('tags')).data
  );

  insertAllTags(tagsResults.tags);
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

    insertUser(userResult);

    return Ok(userResult);
  } catch ({ response: { data } }) {
    const error = guard(object({ errors: genericErrorsDecoder }))(data).errors;

    insertError(error);

    return Err(error);
  }
}

export async function getUser(): Promise<User> {
  const { data } = await axios.get('user');
  const user = guard(object({ user: userDecoder }))(data).user;

  insertUser(user);

  return user;
}

export async function favoriteArticle(slug: string): Promise<Article> {
  const favoritedArticle = guard(object({ article: articleDecoder }))(
    (await axios.post(`articles/${slug}/favorite`)).data
  ).article;
  insertArticle(favoritedArticle);

  return favoritedArticle;
}

export async function unfavoriteArticle(slug: string): Promise<Article> {
  const unfavoritedArticle = guard(object({ article: articleDecoder }))(
    (await axios.delete(`articles/${slug}/favorite`)).data
  ).article;

  insertArticle(unfavoritedArticle);

  return unfavoritedArticle;
}

export async function updateSettings(
  user: UserSettings
): Promise<Result<User, GenericErrors>> {
  try {
    const { data } = await axios.put('user', user);
    const decoded = guard(object({ user: userDecoder }))(data).user;

    insertUser(decoded);

    return Ok(decoded);
  } catch ({ data }) {
    const err = guard(object({ errors: genericErrorsDecoder }))(data).errors;
    insertError(err);
    return Err(err);
  }
}

export async function signUp(
  user: UserForRegistration
): Promise<Result<User, GenericErrors>> {
  try {
    const { data } = await axios.post('users', { user });
    const decoded = guard(object({ user: userDecoder }))(data).user;

    insertUser(decoded);

    return Ok(decoded);
  } catch ({ response: { data } }) {
    const err = guard(object({ errors: genericErrorsDecoder }))(data).errors;

    insertError(err);

    return Err(err);
  }
}

export async function createArticle(
  article: ArticleForEditor
): Promise<Result<Article, GenericErrors>> {
  try {
    const { data } = await axios.post('articles', { article });
    const decoded = guard(object({ article: articleDecoder }))(data).article;
    insertArticle(decoded);
    return Ok(decoded);
  } catch ({ response: { data } }) {
    const error = guard(object({ errors: genericErrorsDecoder }))(data).errors;
    console.log('err here', error);
    insertError(error);
    return Err(error);
  }
}

export async function getArticle(slug: string): Promise<Article> {
  const { data } = await axios.get(`articles/${slug}`);

  const article = guard(object({ article: articleDecoder }))(data).article;

  insertArticle(article);

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
    insertArticle(updatedArticle);
    return Ok(updatedArticle);
  } catch ({ response: { data } }) {
    const err = guard(object({ errors: genericErrorsDecoder }))(data).errors;
    insertError(err);
    return Err(err);
  }
}

export async function getProfile(username: string): Promise<Profile> {
  const { data } = await axios.get(`profiles/${username}`);

  const profileData = guard(object({ profile: profileDecoder }))(data).profile;

  insert({
    [username]: profileData,
  });

  return profileData;
}

export async function followUser(username: string): Promise<Profile> {
  const { data } = await axios.post(`profiles/${username}/follow`);

  const following = guard(object({ profile: profileDecoder }))(data).profile;

  insertProfile(following);

  return following;
}

export async function unfollowUser(username: string): Promise<Profile> {
  const { data } = await axios.delete(`profiles/${username}/follow`);

  const unfollowing = guard(object({ profile: profileDecoder }))(data).profile;

  insertProfile(unfollowing);

  return unfollowing;
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
  articles.articles.forEach((a) => insertArticle(a));

  return articles;
}

export async function getArticleComments(slug: string): Promise<Comment[]> {
  const { data } = await axios.get(`articles/${slug}/comments`);

  const comments = guard(object({ comments: array(commentDecoder) }))(
    data
  ).comments;

  insertComments(comments);

  return comments;
}

export async function deleteComment(
  slug: string,
  commentId: number
): Promise<void> {
  await axios.delete(`articles/${slug}/comments/${commentId}`);
  retractComment(commentId);
}

export async function createComment(
  slug: string,
  body: string
): Promise<Comment> {
  const { data } = await axios.post(`articles/${slug}/comments`, {
    comment: { body },
  });

  const comment = guard(object({ comment: commentDecoder }))(data).comment;

  insertComments([comment]);

  return comment;
}

export async function deleteArticle(slug: string): Promise<void> {
  await axios.delete(`articles/${slug}`);
  retractArticle(slug);
}
