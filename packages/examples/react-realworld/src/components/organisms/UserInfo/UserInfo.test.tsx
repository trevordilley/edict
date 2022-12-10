import { act, fireEvent, render, screen } from '@testing-library/react';
import { UserInfo } from './UserInfo';
import { initializeSession } from '../../../rules/session';
import { Edict } from '../../../rules/EdictContext';

const initialize = () => {
  const session = initializeSession();
  session.USER.ACTIONS.insertUser({
    email: 'jake@jake.jake',
    token: 'jwt.token.here',
    username: 'jake',
    bio: 'I work at statefarm',
    image: null,
  });
  return session;
};
describe('UserInfo...', () => {
  it('Should toggle favorite', async () => {
    const mockOnFollowToggle = jest.fn();
    const session = initialize();
    render(
      <Edict session={session}>
        <UserInfo
          user={{
            username: 'test jack',
            bio: 'I work at statefarm',
            image: null,
            following: false,
          }}
          disabled={false}
          onFollowToggle={mockOnFollowToggle}
        />
      </Edict>
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Follow test jack'));
    });

    expect(mockOnFollowToggle.mock.calls).toHaveLength(1);
  });

  it('Should toggle favorite for followed', async () => {
    const mockOnFollowToggle = jest.fn();
    const session = initialize();
    render(
      <Edict session={session}>
        <UserInfo
          user={{
            username: 'test jack',
            bio: 'I work at statefarm',
            image: null,
            following: true,
          }}
          disabled={false}
          onFollowToggle={mockOnFollowToggle}
        />
      </Edict>
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Unfollow test jack'));
    });

    expect(mockOnFollowToggle.mock.calls).toHaveLength(1);
  });

  it('Should trigger edit settings', async () => {
    const mockOnEditSettings = jest.fn();
    const session = initialize();
    render(
      <Edict session={session}>
        <UserInfo
          user={{
            username: 'jake',
            bio: 'I work at statefarm',
            image: null,
            following: true,
          }}
          disabled={false}
          onEditSettings={mockOnEditSettings}
        />
      </Edict>
    );
    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile Settings'));
    });

    expect(mockOnEditSettings.mock.calls).toHaveLength(1);
  });
});
