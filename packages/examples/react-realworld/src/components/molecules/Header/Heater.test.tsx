import { render, screen } from '@testing-library/react';
import { Header } from './Header';
import { initializeSession } from '../../../rules/session';
import { Edict } from '../../../rules/EdictContext';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';

it('Should render', () => {
  const session = initializeSession();
  render(
    <Edict session={session}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Header />}></Route>
        </Routes>
      </MemoryRouter>
    </Edict>
  );
});

describe('Header for guest', () => {
  beforeEach(() => {
    const session = initializeSession();
    render(
      <Edict session={session}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Header />}></Route>
          </Routes>
        </BrowserRouter>
      </Edict>
    );
  });

  it('Should render Sign in link', () => {
    expectLinkByText('Sign in', 'login');
  });

  it('Should render Sign up link', () => {
    expectLinkByText('Sign up', 'register');
  });

  it('Should not render New Article link', () => {
    expectEmptyQueryByText('New Article');
  });

  it('Should not render Settings link', () => {
    expectEmptyQueryByText('Settings');
  });
});

describe('Header for user', () => {
  beforeEach(() => {
    const session = initializeSession();
    session.USER.ACTIONS.insertUser({
      email: 'jake@jake.jake',
      token: 'jwt.token.here',
      username: 'jake',
      bio: 'I work at statefarm',
      image: null,
    });
    render(
      <Edict session={session}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<Header />}></Route>
          </Routes>
        </MemoryRouter>
      </Edict>
    );
  });

  it('Should render New Article link', () => {
    expectLinkByText('New Article', 'editor');
  });

  it('Should render Settings link', () => {
    expectLinkByText('Settings', 'settings');
  });

  it('Should render user link', () => {
    expectLinkByText('jake', 'profile/jake');
  });

  it('Should not render Sign in link', () => {
    expectEmptyQueryByText('Sign in');
  });

  it('Should not render Sign up link', () => {
    expectEmptyQueryByText('Sign up');
  });
});

function expectLinkByText(text: string, href: string) {
  const link = screen.getByText(text);
  expect(link).toBeInTheDocument();
  expect(link.nodeName).toMatch('A');
  expect(link.getAttribute('href')).toMatch('/' + href);
}

function expectEmptyQueryByText(text: string) {
  expect(screen.queryAllByText(text)).toHaveLength(0);
}
