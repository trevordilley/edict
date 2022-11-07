import { useEffect, useState } from 'react';
import { articleListRule, articleMetaRule, articleRules } from './article';

export const useArticles = () => {
  const [articles, setArticles] = useState(articleRules.query());
  const [articleCount, setArticleCount] = useState(articleListRule.query()[0]);

  useEffect(() => {
    return articleRules.subscribe((a) => setArticles(a));
  });
  useEffect(() => {
    return articleListRule.subscribe((c) => setArticleCount(c[0]));
  });

  return {
    articles: articles.map((a) => ({
      article: a.$article,
      isSubmitting: a.$article.isSubmitting,
    })),
    articleCount: articleCount.ArticleList.articleCount,
  };
};

export const useArticle = (slug: string) => {
  const filter = {
    $article: {
      ids: [slug],
    },
  };
  const [article, setArticle] = useState(articleRules.queryOne(filter));
  useEffect(() =>
    articleRules.subscribeOne((a) => {
      setArticle(a);
    }, filter)
  );
  return article;
};

export const useArticleMeta = (slug: string) => {
  const filter = {
    [slug]: {
      ids: [slug],
    },
  };

  const [articleMeta, setArticleMeta] = useState(
    articleMetaRule.queryOne(filter)
  );

  useEffect(() =>
    articleMetaRule.subscribeOne((a) => setArticleMeta(a), filter)
  );

  return articleMeta?.$articleMeta;
};
