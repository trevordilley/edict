import { Fragment } from 'react';
import { Article } from '../../types/article';
import { classObjectToClassName } from '../../types/style';
import { ArticlePreview } from '../ArticlePreview/ArticlePreview';
import { Pagination } from '../Pagination/Pagination';
import { ArticleViewerState } from './ArticlesViewer.slice';
import { useArticles } from '../../rules/article/useArticle';
import { None, Some } from '@hqoss/monads';
import { useHome } from '../../rules/home/useHome';
import { session } from '../../rules/session';

export function ArticlesViewer({
  toggleClassName,
  tabs,
  selectedTab,
  onPageChange,
  onTabChange,
}: {
  toggleClassName: string;
  tabs: string[];
  selectedTab: string;
  onPageChange?: (index: number) => void;
  onTabChange?: (tab: string) => void;
}) {
  const { articles, articleCount } = useArticles();
  const { currentPage } = useHome();
  return (
    <Fragment>
      <ArticlesTabSet
        {...{ tabs, selectedTab, toggleClassName, onTabChange }}
      />
      <ArticleList articles={articles.length > 0 ? Some(articles) : None} />
      <Pagination
        currentPage={currentPage}
        count={articleCount}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    </Fragment>
  );
}

function ArticlesTabSet({
  tabs,
  toggleClassName,
  selectedTab,
  onTabChange,
}: {
  tabs: string[];
  toggleClassName: string;
  selectedTab: string;
  onTabChange?: (tab: string) => void;
}) {
  return (
    <div className={toggleClassName}>
      <ul className="nav nav-pills outline-active">
        {tabs.map((tab) => (
          <Tab
            key={tab}
            tab={tab}
            active={tab === selectedTab}
            onClick={() => onTabChange && onTabChange(tab)}
          />
        ))}
      </ul>
    </div>
  );
}

function Tab({
  tab,
  active,
  onClick,
}: {
  tab: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li className="nav-item">
      <a
        className={classObjectToClassName({ 'nav-link': true, active })}
        href="#"
        onClick={(ev) => {
          ev.preventDefault();
          onClick();
        }}
      >
        {tab}
      </a>
    </li>
  );
}

function ArticleList({
  articles,
}: {
  articles: ArticleViewerState['articles'];
}) {
  return articles.match({
    none: () => (
      <div className="article-preview" key={1}>
        Loading articles...
      </div>
    ),
    some: (articles) => (
      <Fragment>
        {articles.length === 0 && (
          <div className="article-preview" key={1}>
            No articles are here... yet.
          </div>
        )}
        {articles.map(({ article, isSubmitting }, index) => (
          <ArticlePreview
            key={article.slug}
            article={article}
            isSubmitting={isSubmitting}
            onFavoriteToggle={() => onFavoriteToggle(index, article)}
          />
        ))}
      </Fragment>
    ),
  });
}

function onFavoriteToggle(index: number, { slug, favorited }: Article) {
  session.insert({
    [slug]: {
      slug,
      favorited,
      isFavoriting: true,
    },
  });
}
