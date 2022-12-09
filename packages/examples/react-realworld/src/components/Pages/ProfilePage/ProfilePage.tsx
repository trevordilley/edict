import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  followUser,
  getProfile,
  unfollowUser,
} from '../../../services/conduit';
import { redirect } from '../../../types/location';
import { Profile } from '../../../types/profile';
import { ArticlesViewer } from '../../organisms/ArticlesViewer/ArticlesViewer';
import { UserInfo } from '../../organisms/UserInfo/UserInfo';
import { useRuleOne } from '../../../rules/useRule';
import { useEdict } from '../../../rules/EdictContext';
import { EdictSession } from '../../../rules/session';

const useProfile = (username?: string) => {
  const { USER } = useEdict();

  return useRuleOne(USER.RULES.userProfileRule, {
    $userProfile: {
      ids: [username ?? ''],
    },
  });
};

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const profile = useProfile(username)?.$userProfile;
  const favorites = useLocation().pathname.endsWith('favorites');
  const EDICT = useEdict();
  useEffect(() => {
    if (!username) return;
    onLoad(username, favorites, EDICT);
  }, [username]);

  if (!username) return <></>;
  return (
    <div className="profile-page">
      {profile ? (
        <UserInfo
          user={profile}
          disabled={profile.isSubmitting}
          onFollowToggle={onFollowToggle(profile, EDICT)}
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
              onTabChange={onTabChange(username, EDICT)}
              onPageChange={onPageChange(username, favorites, EDICT)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

async function onLoad(
  username: string,
  favorites: boolean,
  EDICT: EdictSession
) {
  try {
    await getProfile(username);
    await getArticlesByType(username, favorites, EDICT);
  } catch {
    EDICT.USER.ACTIONS.windowRedirect('#/');
  }
}

async function getArticlesByType(
  username: string,
  favorites: boolean,
  EDICT: EdictSession
) {
  const {
    ArticleList: { currentPage },
  } = EDICT.ARTICLE.RULES.articleListRule.query()[0];
  return await EDICT.ARTICLE.ACTIONS.loadArticlesIntoSession({
    [favorites ? 'favorited' : 'author']: username,
    offset: (currentPage - 1) * 10,
  });
}

function onFollowToggle(profile: Profile, EDICT: EdictSession): () => void {
  return async () => {
    const user = EDICT.USER.RULES.userRule.queryOne();

    if (!user) {
      redirect('register');
      return;
    }
    const fn = profile.following ? unfollowUser : followUser;
    const updatedProfile = await fn(profile.username);
    EDICT.PROFILE.ACTIONS.insertProfile(updatedProfile);
  };
}

function onTabChange(
  username: string,
  EDICT: EdictSession
): (page: string) => void {
  return async (page) => {
    const favorited = page === 'Favorited Articles';
    const navTo = `#/profile/${username}${!favorited ? '' : '/favorites'}`;
    EDICT.USER.ACTIONS.windowRedirect(navTo);
    EDICT.ARTICLE.ACTIONS.resetArticles();
    await getArticlesByType(username, favorited, EDICT);
  };
}

function onPageChange(
  username: string,
  favorited: boolean,
  EDICT: EdictSession
): (index: number) => void {
  return async (index) => {
    EDICT.ARTICLE.ACTIONS.changeArticlesPage(index);
    await getArticlesByType(username, favorited, EDICT);
  };
}
