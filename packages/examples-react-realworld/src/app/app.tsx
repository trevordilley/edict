import styled from 'styled-components';

import {
  BrowserRouter,
  Navigate,
  Route,
  RouteProps,
  Routes,
} from 'react-router-dom';
import { Footer } from '../components/Footer/Footer';
import { Home } from '../components/Pages/Home/Home';
import { ArticlePage } from '../components/Pages/ArticlePage/ArticlePage';
import { Header } from '../components/Header/Header';
import axios from 'axios';
import { useStoreWithInitializer } from '../state/storeHooks';
import { store } from '../state/store';
import { endLoad, loadUser } from '../components/App/App.slice';
import { getUser } from '../services/conduit';

const StyledApp = styled.div`
  // Your style here
`;

export function App() {
  const { loading, user } = useStoreWithInitializer(({ app }) => app, load);
  const userIsLogged = user.isSome();

  return (
    <>
      {!loading && (
        <>
          <Header />
          <BrowserRouter>
            <Routes>
              {/*<GuestOnlyRoute path="/login" userIsLogged={userIsLogged}>*/}
              {/*  <Login />*/}
              {/*</GuestOnlyRoute>*/}
              {/*<GuestOnlyRoute path="/register" userIsLogged={userIsLogged}>*/}
              {/*  <Register />*/}
              {/*</GuestOnlyRoute>*/}
              {/*<UserOnlyRoute path="/settings" userIsLogged={userIsLogged}>*/}
              {/*  <Settings />*/}
              {/*</UserOnlyRoute>*/}
              {/*<UserOnlyRoute path="/editor" userIsLogged={userIsLogged}>*/}
              {/*  <NewArticle />*/}
              {/*</UserOnlyRoute>*/}
              {/*<UserOnlyRoute path="/editor/:slug" userIsLogged={userIsLogged}>*/}
              {/*  <EditArticle />*/}
              {/*</UserOnlyRoute>*/}
              {/*<Route path="/profile/:username">*/}
              {/*  <ProfilePage />*/}
              {/*</Route>*/}
              <Route path="/article/:slug" element={<ArticlePage />} />
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
          <Footer />
        </>
      )}
    </>
  );
}

async function load() {
  const token = localStorage.getItem('token');
  if (!store.getState().app.loading || !token) {
    store.dispatch(endLoad());
    return;
  }
  axios.defaults.headers.Authorization = `Token ${token}`;

  try {
    store.dispatch(loadUser(await getUser()));
  } catch {
    store.dispatch(endLoad());
  }
}

function GuestOnlyRoute({
  children,
  userIsLogged,
  ...rest
}: {
  children: JSX.Element | JSX.Element[];
  userIsLogged: boolean;
} & RouteProps) {
  return (
    <Route {...rest}>
      {children}
      {userIsLogged && <Navigate to="/" />}
    </Route>
  );
}

function UserOnlyRoute({
  children,
  userIsLogged,
  ...rest
}: {
  children: JSX.Element | JSX.Element[];
  userIsLogged: boolean;
} & RouteProps) {
  return (
    <Route {...rest}>
      {children}
      {!userIsLogged && <Navigate to="/" />}
    </Route>
  );
}
