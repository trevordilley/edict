import { Err, Ok } from '@hqoss/monads';
import { fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import { act } from 'react-dom/test-utils';
import { login } from '../../../services/conduit';
import { Login } from './Login';
import { initializeSession } from '../../../rules/session';
import { Edict } from '../../../rules/EdictContext';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../../../services/conduit');
jest.mock('axios');

const mockedLogin = login as jest.Mock<ReturnType<typeof login>>;

it('Should render', () => {
  const session = initializeSession();
  render(
    <Edict session={session}>
      <Login />
    </Edict>
  );
});

it('Should show errors if login fails and stop disabling the fields', async () => {
  const session = initializeSession();
  mockedLogin.mockResolvedValueOnce(
    Err({ 'email or password': ['is invalid', 'is empty'] })
  );
  render(
    <Edict session={session}>
      <Login />
    </Edict>
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button'));
  });

  expect(screen.getByText('email or password is invalid')).toBeInTheDocument();
  expect(screen.getByText('email or password is empty')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Email')).not.toBeDisabled();
  expect(screen.getByPlaceholderText('Password')).not.toBeDisabled();
});

it('Should disable fields during login', async () => {
  const session = initializeSession(false);
  await act(async () => {
    session.ENGINE.insert({
      Login: {
        email: 'jake@jake.com',
        password: 'password',
      },
    });
  });
  render(
    <Edict session={session}>
      <Login />
    </Edict>
  );
  expect(screen.getByPlaceholderText('Email')).toBeDisabled();
  expect(screen.getByPlaceholderText('Password')).toBeDisabled();
});

it('Should not try to login if it is already loging in', async () => {
  const session = initializeSession();
  mockedLogin.mockResolvedValueOnce(
    Ok({
      email: 'jake@jake.jake',
      token: 'jwt.token.here',
      username: 'jake',
      bio: 'I work at statefarm',
      image: null,
    })
  );
  localStorage.clear();
  render(
    <Edict session={session}>
      <Login />
    </Edict>
  );

  await act(async () => {
    session.ENGINE.insert({
      Login: {
        email: 'jake@jake.com',
        password: 'password',
      },
    });
    fireEvent.click(screen.getByRole('button'));
  });

  expect(mockedLogin.mock.calls.length).toBe(0);
  mockedLogin.mockClear();
});

it('Should redirect to home if login is successful and setup auth', async () => {
  mockedLogin.mockResolvedValueOnce(
    Ok({
      email: 'jake@jake.jake',
      token: 'jwt.token.here',
      username: 'jake',
      bio: 'I work at statefarm',
      image: null,
    })
  );
  render(<Login />);

  await act(async () => {
    store.dispatch(logout());
    fireEvent.click(screen.getByRole('button'));
  });

  expect(location.hash).toMatch('#/');
  expect(localStorage.getItem('token')).toMatch('jwt.token.here');
  expect(axios.defaults.headers.Authorization).toMatch('Token jwt.token.here');
  expect(store.getState().app.user.isSome()).toBe(true);
});
