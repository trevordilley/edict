import { useEffect, useState } from 'react';
import { articleCountRule, articleRules } from './article';

export const useArticles = () => {
  const [articles, setArticles] = useState(articleRules.query());
  const [articleCount, setArticleCount] = useState(articleCountRule.query()[0]);

  useEffect(() => {
    return articleRules.subscribe((a) => setArticles(a));
  });
  useEffect(() => {
    return articleCountRule.subscribe((c) => setArticleCount(c[0]));
  });

  return {
    articles: articles.map((a) => ({
      article: a.$article,
      isSubmitting: a.$article.isSubmitting,
    })),
    articleCount: articleCount.ArticleList.articleCount,
  };
};
