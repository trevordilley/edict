import { Option, Some } from '@hqoss/monads';
import { getTags } from '../../../services/conduit';
import { ArticlesViewer } from '../../ArticlesViewer/ArticlesViewer';
import { ContainerPage } from '../../ContainerPage/ContainerPage';
import { useHome } from '../../../rules/home/useHome';
import { getUser } from '../../../rules/user/user';
import { changeHomeTab } from '../../../rules/home/home';
import { HOME_TAB } from '../../../rules/schema';
import { session } from '../../../rules/session';
import { useEffect } from 'react';

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
            selectedTab={selectedTab}
            tabs={tabNames}
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
  const user = getUser();
  if (user !== undefined) {
    changeHomeTab(HOME_TAB.YOUR_FEED);
  }

  session.insert({
    ArticleList: {
      currentPage: 1,
    },
  });

  await getTags();
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
