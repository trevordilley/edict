import { Article } from '../types/article';
import { User, UserSettings } from '../types/user';
import { edict } from '@edict/core';
import { Profile } from '../types/profile';
import { Comment } from '../types/comment';

interface Error {
  error: { [key: string]: string[] };
}

type Schema = Article &
  User &
  Error &
  Profile &
  UserSettings &
  Comment & { articleCount: number };

const session = edict<Schema>(true);

export const { insert, retract, debug } = session;

export const insertArticle = (article: Article) => {
  insert({
    [article.slug]: article,
  });
};

export const insertArticleCount = (articleCount: number) => {
  insert({
    ArticleMeta: {
      articleCount,
    },
  });
};

export const insertUser = (user: User) => {
  insert({ User: { ...user } });
};

export const insertProfile = (profile: Profile) => {
  insert({ [profile.username]: { ...profile } });
};

export const insertError = (error: { [key: string]: string[] }) => {
  insert({ Error: error });
};

export const insertAllTags = (tags: string[]) => {
  insert({
    AllTags: {
      tagList: tags,
    },
  });
};

export const insertComments = (comments: Comment[]) => {
  comments.forEach((c) => {
    insert({
      [`comment${c.id}`]: c,
    });
  });
};

export const retractComment = (commentId: number) => {
  retract(`comment${commentId}`, 'createdAt', 'updatedAt', 'body', 'author');
};

export const retractArticle = (slug: string) => {
  retract(
    slug,
    'slug',
    'title',
    'description',
    'body',
    'tagList',
    'createdAt',
    'updatedAt',
    'favorited',
    'favoritesCount',
    'author'
  );
};
const { rule } = session;

export const articleRules = rule(
  'Articles',
  ({
    slug,
    title,
    body,
    description,
    tagList,
    createdAt,
    updatedAt,
    favorited,
    favoritesCount,
    author,
  }) => ({
    $article: {
      slug,
      title,
      body,
      description,
      tagList,
      createdAt,
      updatedAt,
      favorited,
      favoritesCount,
      author,
    },
  })
).enact();

export const articleCountRule = rule('Article Count', ({ articleCount }) => ({
  ArticleMeta: {
    articleCount,
  },
})).enact();

// TODO: Notice this repetition.... need to figure out a better api here...
export const userRule = rule(
  'User',
  ({ username, image, bio, email, token }) => ({
    User: {
      username,
      image,
      email,
      token,
      bio,
    },
  })
).enact();

export const publicUserRule = rule(
  'Public User',
  ({ username, image, bio }) => ({
    $publicUser: {
      username,
      image,
      bio,
    },
  })
).enact();
