import { Fragment } from 'react';
import { Article } from '../../types/article';
import { classObjectToClassName } from '../../types/style';
import { ArticlePreview } from '../ArticlePreview/ArticlePreview';
import { Pagination } from '../Pagination/Pagination';
import { useArticles } from '../../rules/article/useArticle';
import { useHome } from '../../rules/home/useHome';
import { session } from '../../rules/session';
import { FetchState } from '../../rules/schema';

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
  const home = useHome();

  if (!home) return <span />;
  return (
    <Fragment>
      <ArticlesTabSet
        {...{ tabs, selectedTab, toggleClassName, onTabChange }}
      />
      <ArticleList articles={articles} />
      <Pagination
        currentPage={home.currentPage ?? 1}
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
  articles?: { article: Article; isSubmitting: boolean }[];
}) {
  return articles ? (
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
  ) : (
    <div className="article-preview" key={1}>
      Loading articles...
    </div>
  );
}

function onFavoriteToggle(index: number, { slug, favorited }: Article) {
  session.insert({
    [slug]: {
      slug,
      favorited,
      isFavoriting: FetchState.QUEUED,
    },
  });
}
