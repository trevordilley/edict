import { articleListRule, articleMetaRule, articleRules } from './article';
import { useRule, useRuleOne } from '../useRule';

export const useArticles = () => {
  const articles = useRule(articleRules);
  const articleCount = useRuleOne(articleListRule);

  return {
    articles: articles.map((a) => ({
      article: a.$article,
      isSubmitting: a.$article.isSubmitting,
    })),
    articleCount: articleCount?.ArticleList.articleCount ?? 0,
  };
};

export const useArticle = (slug: string) => {
  const article = useRuleOne(articleRules, { $article: { ids: [slug] } });
  return article;
};

export const useArticleMeta = (slug: string) => {
  const articleMeta = useRuleOne(articleMetaRule, {
    $articleMeta: {
      ids: [slug],
    },
  });
  return articleMeta?.$articleMeta;
};
