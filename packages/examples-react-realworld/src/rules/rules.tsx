import { Article } from '../types/article';
import { User, UserSettings } from '../types/user';
import { edict } from '@edict/core';
import { Profile } from '../types/profile';
import { Comment } from '../types/comment';

interface Error {
  errors: { [key: string]: string[] };
}

type Schema = Article &
  User &
  Error &
  Profile &
  UserSettings &
  Comment & { articleCount: number };

const session = edict<Schema>(true);

export const { insert, retract, retractByConditions, conditions, debug } =
  session;

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

// TODO: Handle undefined state for login/logout/etc. so we can enforce rules based on login state
export const insertUser = (user: User) => {
  insert({ User: { ...user } });
};

export const insertProfile = (profile: Profile) => {
  insert({ [profile.username]: { ...profile } });
};

// TODO: Types didn't save us here... hmm....
export const insertError = (errorObj: { [key: string]: string[] }) => {
  insert({ Error: { errors: errorObj } });
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

const articleConditions = conditions(
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
  })
);

export const retractArticle = (slug: string) => {
  retractByConditions(slug, articleConditions);
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

export const errorRule = rule('Errors', ({ errors }) => ({
  Error: {
    errors,
  },
})).enact();

insert({
  Error: {
    errors: {},
  },
});
