import { Article } from '../../types/article';
import { session } from '../session';
import { ID } from '../schema';

const { insert, rule, conditions, retractByConditions } = session;

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
    isSubmitting,
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
    isSubmitting,
  })
);

export const insertArticle = (article: Article, isSubmitting = false) => {
  insert({
    [ID.ARTICLE(article)]: {
      ...article,
      isSubmitting,
    },
  });
};

export const insertArticleCount = (articleCount: number) => {
  insert({
    ArticleList: {
      articleCount,
    },
  });
};

export const retractArticle = (slug: string) => {
  retractByConditions(slug, articleConditions);
};

export const articleRules = rule('Articles', () => ({
  $article: articleConditions,
})).enact();

export const resetArticles = () => {
  articleRules.query().forEach((a) => {
    retractArticle(a.$article.slug);
  });
};

export const articleCountRule = rule('Article Count', ({ articleCount }) => ({
  ArticleList: {
    articleCount,
  },
})).enact();
