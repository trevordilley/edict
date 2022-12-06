import { Profile } from '../../../types/profile';
import { useUser } from '../../../rules/user/useUser';

export function UserInfo({
  user: { image, username, bio, following },
  disabled,
  onFollowToggle,
  onEditSettings,
}: {
  user: Profile;
  disabled: boolean;
  onFollowToggle?: () => void;
  onEditSettings?: () => void;
}) {
  const sessionUser = useUser();

  return (
    <div className="user-info">
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <img src={image || undefined} className="user-img" />
            <h4>{username}</h4>
            <p>{bio}</p>

            {sessionUser?.username === username ? (
              <EditProfileButton onClick={onEditSettings} disabled={disabled} />
            ) : (
              <ToggleFollowButton
                following={following}
                username={username}
                disabled={disabled}
                onClick={onFollowToggle}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleFollowButton({
  following,
  username,
  disabled,
  onClick,
}: {
  following: boolean;
  username: string;
  disabled: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="btn btn-sm btn-outline-secondary action-btn"
      onClick={onClick}
      disabled={disabled}
    >
      <i className="ion-plus-round"></i>
      &nbsp;
      {following ? ' Unfollow' : ' Follow'} {username}
    </button>
  );
}

function EditProfileButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="btn btn-sm btn-outline-secondary action-btn"
      onClick={onClick}
      disabled={disabled}
    >
      <i className="ion-gear-a"></i>&nbsp; Edit Profile Settings
    </button>
  );
}
