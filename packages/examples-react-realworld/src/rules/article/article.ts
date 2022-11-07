import { Article } from '../../types/article';
import { session } from '../session';
import { FetchState, ID } from '../schema';
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
  ({ favorited, slug, token, favoritesCount }) => ({
    $article: {
      favorited,
      slug,
      favoritesCount,
      isFavoriting: { match: FetchState.QUEUED },
    },
    $user: {
      token,
    },
  })
).enact({
  then: ({ $article: { id, favorited, slug, favoritesCount }, $user }) => {
    if (!$user.token) {
      window.location.hash = '#/login';
      return;
    }
    console.log('Favoriting?');
    insert({
      [slug]: {
        isFavoriting: FetchState.SENT,
        favorited: !favorited,
        favoritesCount: favorited ? favoritesCount - 1 : favoritesCount + 1,
      },
    });
    const result = favorited ? unfavoriteArticle(slug) : favoriteArticle(slug);
    result.then((r) => {
      insert({
        [slug]: {
          isFavoriting: FetchState.DONE,
          favorited: r.favorited,
          favoritesCount: r.favoritesCount,
        },
      });
    });
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
      ArticleList: {
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

export const articleMetaRule = rule(
  'Article Meta',
  ({ slug, submittingFavorite, submittingFollow, deletingArticle }) => ({
    $articleMeta: {
      slug,
      submittingFavorite,
      submittingFollow,
      deletingArticle,
    },
  })
).enact();

export const articleListRule = rule(
  'Article List',
  ({ articleCount, currentPage }) => ({
    ArticleList: {
      articleCount,
      currentPage,
    },
  })
).enact();

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

export const changeArticlesPage = (currentPage: number) => {
  insert({
    ArticleList: {
      currentPage,
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
