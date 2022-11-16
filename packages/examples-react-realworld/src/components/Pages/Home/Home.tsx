import { Option, Some } from '@hqoss/monads';
import { ArticlesViewer } from '../../organisms/ArticlesViewer/ArticlesViewer';
import { ContainerPage } from '../../atoms/ContainerPage/ContainerPage';
import { changeHomeTab, homePageRule } from '../../../rules/home/home';
import { FetchState, HOME_TAB } from '../../../rules/schema';
import { session } from '../../../rules/session';
import { useEffect } from 'react';
import { useRuleOne } from '../../../rules/useRule';
import { userRule } from '../../../rules/user/user';

export const useHome = () => {
  const home = useRuleOne(homePageRule);
  console.log(home?.HomePage.tabNames);
  return {
    selectedTab: home?.HomePage.selectedTab,
    tagList: home?.Tags.tagList,
    tabNames: home?.HomePage.tabNames,
    currentPage: home?.ArticleList.currentPage,
  };
};
export function Home() {
  useEffect(() => {
    load();
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
            onPageChange={onPageChange}
            onTabChange={changeHomeTab}
          />
        </div>

        <div className="col-md-3">
          <HomeSidebar tags={Some(tags)} />
        </div>
      </ContainerPage>
    </div>
  );
}

async function load() {
  const user = userRule.queryOne();
  if (user !== undefined) {
    console.log(user);
    changeHomeTab(HOME_TAB.YOUR_FEED);
  }

  session.insert({
    ArticleList: {
      currentPage: 1,
    },
    Tags: {
      fetchState: FetchState.QUEUED,
    },
  });
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

async function onPageChange(index: number) {
  session.insert({
    ArticleList: {
      currentPage: index,
    },
  });
}

function HomeSidebar({ tags }: { tags: Option<string[]> }) {
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
                href="#"
                className="tag-pill tag-default"
                onClick={() => changeHomeTab(`# ${tag}`)}
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
