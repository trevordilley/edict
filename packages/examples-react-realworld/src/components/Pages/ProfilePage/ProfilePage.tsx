import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  followUser,
  getArticles,
  getProfile,
  unfollowUser,
} from '../../../services/conduit';
import { redirect } from '../../../types/location';
import { Profile } from '../../../types/profile';
import { ArticlesViewer } from '../../organisms/ArticlesViewer/ArticlesViewer';
import { UserInfo } from '../../organisms/UserInfo/UserInfo';
import {
  userProfileRule,
  userRule,
  windowRedirect,
} from '../../../rules/user/user';
import {
  articleListRule,
  changeArticlesPage,
  resetArticles,
} from '../../../rules/article/article';
import { useRuleOne } from '../../../rules/useRule';

const useProfile = (username?: string) =>
  useRuleOne(userProfileRule, {
    $userProfile: {
      ids: [username ?? ''],
    },
  });

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  console.log('username?', username);
  const profile = useProfile(username)?.$userProfile;
  const favorites = useLocation().pathname.endsWith('favorites');
  useEffect(() => {
    if (!username) return;
    onLoad(username, favorites);
  }, [username]);

  if (!username) return <></>;
  return (
    <div className="profile-page">
      {profile ? (
        <UserInfo
          user={profile}
          disabled={profile.isSubmitting}
          onFollowToggle={onFollowToggle(profile)}
          onEditSettings={() => redirect('settings')}
        />
      ) : (
        <div className="article-preview" key={1}>
          Loading profile...
        </div>
      )}

      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <ArticlesViewer
              toggleClassName="articles-toggle"
              tabs={['My Articles', 'Favorited Articles']}
              selectedTab={favorites ? 'Favorited Articles' : 'My Articles'}
              onTabChange={onTabChange(username)}
              onPageChange={onPageChange(username, favorites)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

async function onLoad(username: string, favorites: boolean) {
  try {
    await getProfile(username);
    await getArticlesByType(username, favorites);
  } catch {
    windowRedirect('#/');
  }
}

async function getArticlesByType(username: string, favorites: boolean) {
  const {
    ArticleList: { currentPage },
  } = articleListRule.query()[0];
  return await getArticles({
    [favorites ? 'favorited' : 'author']: username,
    offset: (currentPage - 1) * 10,
  });
}

function onFollowToggle(profile: Profile): () => void {
  return async () => {
    const user = userRule.queryOne();

    if (!user) {
      redirect('register');
      return;
    }

    if (profile.following) {
      await unfollowUser(profile.username);
    } else {
      await followUser(profile.username);
    }
  };
}

function onTabChange(username: string): (page: string) => void {
  return async (page) => {
    const favorited = page === 'Favorited Articles';
    const navTo = `#/profile/${username}${!favorited ? '' : '/favorites'}`;
    windowRedirect(navTo);
    resetArticles();
    await getArticlesByType(username, favorited);
  };
}

function onPageChange(
  username: string,
  favorited: boolean
): (index: number) => void {
  return async (index) => {
    changeArticlesPage(index);
    await getArticlesByType(username, favorited);
  };
}
