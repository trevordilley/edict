import { Article } from '../../types/article';
import { session } from '../session';
import { ID } from '../schema';
import {
  favoriteArticle,
  getArticles,
  getFeed,
  unfavoriteArticle,
} from '../../services/conduit';

const { insert, retract, rule, conditions, retractByConditions } = session;

// =================== \\
// Rules               \\
// =================== \\
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

rule(
  'Changing the favorite-ness of an article updates the db',
  ({ favorited, slug, token, isSubmitting }) => ({
    $article: {
      favorited,
      slug,
      isFavoriting: { then: false },
      isSubmitting,
    },
    User: {
      token,
    },
  })
).enact({
  when: ({ $article: { isSubmitting } }) => !isSubmitting,
  then: ({ $article: { id, favorited, slug }, User }) => {
    retract(id, 'isFavoriting');

    if (!User.token) {
      window.location.hash = '#/login';
      return;
    }

    if (favorited) unfavoriteArticle(slug);
    else favoriteArticle(slug);
  },
});

rule(
  'Changing the page or limit updates the offset',
  ({ currentPage, limit }) => ({
    ArticleList: {
      currentPage,
      limit,
    },
  })
).enact({
  then: ({ ArticleList: { currentPage, limit } }) => {
    insert({
      HomePage: {
        offset: (currentPage - 1) * limit,
      },
    });
  },
});

rule(
  'changes to page filters refetches articles',
  ({ selectedTab, offset, limit, tag, filterByAuthor }) => ({
    HomePage: {
      selectedTab,
    },
    ArticleList: {
      offset,
      limit,
      filterByAuthor,
      tag,
    },
  })
).enact({
  then: async ({
    HomePage: { selectedTab },
    ArticleList: { offset, limit, tag, filterByAuthor },
  }) => {
    const filters = {
      offset,
      limit,
      tag,
      filterByAuthor,
    };
    // Remove undefined
    Object.keys(filters).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      filters[key] === undefined && delete filters[key];
    });

    const finalFilters = {
      ...filters,
      tag: selectedTab.slice(2),
    };

    resetArticles();
    const fetchArticles = selectedTab === 'Your Feed' ? getFeed : getArticles;
    await fetchArticles(!selectedTab.startsWith('#') ? filters : finalFilters);
  },
});

// =================== \\
// Queries             \\
// =================== \\

export const articleRules = rule('Articles', () => ({
  $article: articleConditions,
})).enact();

export const articleCountRule = rule('Article Count', ({ articleCount }) => ({
  ArticleList: {
    articleCount,
  },
})).enact();

// =================== \\
// Insert/Retracts     \\
// =================== \\
export const resetArticles = () => {
  articleRules.query().forEach((a) => {
    retractArticle(a.$article.slug);
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
export const insertArticle = (article: Article, isSubmitting = false) => {
  insert({
    [ID.ARTICLE(article)]: {
      ...article,
      isSubmitting,
    },
  });
};
