import { Fragment } from 'react';
import { Article } from '../../../types/article';
import { classObjectToClassName } from '../../../types/style';
import { ArticlePreview } from '../ArticlePreview/ArticlePreview';
import { Pagination } from '../../molecules/Pagination/Pagination';
import { useHome } from '../../Pages/Home/Home';
import { useEdict } from '../../../rules/EdictContext';

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
  const EDICT = useEdict();
  const { articles, articleCount } = EDICT.ARTICLE.HOOKS.useArticles();
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
        href="src/components/organisms/ArticlesViewer/ArticlesViewer#"
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

function ArticleList({ articles }: { articles?: { article: Article }[] }) {
  const EDICT = useEdict();
  return articles ? (
    <Fragment>
      {articles.length === 0 && (
        <div className="article-preview" key={1}>
          No articles are here... yet.
        </div>
      )}
      {articles.map(({ article }, index) => (
        <ArticlePreview
          key={article.slug}
          article={article}
          onFavoriteToggle={() =>
            EDICT.ARTICLE.ACTIONS.toggleFavoriteArticle(
              article.slug,
              article.favorited
            )
          }
        />
      ))}
    </Fragment>
  ) : (
    <div className="article-preview" key={1}>
      Loading articles...
    </div>
  );
}
