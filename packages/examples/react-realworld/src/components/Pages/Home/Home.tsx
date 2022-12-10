import { Option, Some } from '@hqoss/monads';
import { ArticlesViewer } from '../../organisms/ArticlesViewer/ArticlesViewer';
import { ContainerPage } from '../../atoms/ContainerPage/ContainerPage';
import { HOME_TAB } from '../../../rules/schema';
import { useEffect } from 'react';
import { useRuleOne } from '../../../rules/useRule';
import { useEdict } from '../../../rules/EdictContext';

export const useHome = () => {
  const { HOME } = useEdict();
  const home = useRuleOne(HOME.RULES.homePageRule);
  return {
    selectedTab: home?.HomePage.selectedTab,
    tagList: home?.Tags.tagList,
    tabNames: home?.HomePage.tabNames,
    currentPage: home?.ArticleList.currentPage,
  };
};
export function Home() {
  const { USER, ARTICLE, HOME } = useEdict();
  useEffect(() => {
    const user = USER.RULES.userRule.queryOne();
    if (user !== undefined) {
      HOME.ACTIONS.changeHomeTab(HOME_TAB.YOUR_FEED);
    }
    ARTICLE.ACTIONS.resetArticlePagination();
  }, []);

  const { tagList: tags, selectedTab, tabNames } = useHome();

  return (
    <div className="home-page">
      {renderBanner()}
      <ContainerPage>
        <div className="col-md-9">
          <ArticlesViewer
            toggleClassName="feed-toggle"
            selectedTab={selectedTab!}
            tabs={tabNames ?? []}
            onPageChange={(idx) => ARTICLE.ACTIONS.setArticlePage(idx)}
            onTabChange={HOME.ACTIONS.changeHomeTab}
          />
        </div>

        <div className="col-md-3">
          <HomeSidebar tags={Some(tags)} />
        </div>
      </ContainerPage>
    </div>
  );
}

function renderBanner() {
  return (
    <div className="banner">
      <div className="container">
        <h1 className="logo-font">conduit</h1>
        <p>A place to share your knowledge.</p>
      </div>
    </div>
  );
}

function HomeSidebar({ tags }: { tags: Option<string[]> }) {
  const { HOME } = useEdict();

  return (
    <div className="sidebar">
      <p>Popular Tags</p>

      {tags.match({
        none: () => <span>Loading tags...</span>,
        some: (tags) => (
          <div className="tag-list">
            {' '}
            {tags.map((tag) => (
              <a
                key={tag}
                href="src/components/Pages/Home/Home#"
                className="tag-pill tag-default"
                onClick={() => HOME.ACTIONS.changeHomeTab(`# ${tag}`)}
              >
                {tag}
              </a>
            ))}{' '}
          </div>
        ),
      })}
    </div>
  );
}
