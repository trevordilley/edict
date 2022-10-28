import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Footer } from '../components/Footer/Footer';
import { Home } from '../components/Pages/Home/Home';
import { ArticlePage } from '../components/Pages/ArticlePage/ArticlePage';
import { Header } from '../components/Header/Header';
import axios from 'axios';
import { useStoreWithInitializer } from '../state/storeHooks';
import { store } from '../state/store';
import { endLoad, loadUser } from '../components/App/App.slice';
import { getUser } from '../services/conduit';
import { Login } from '../components/Pages/Login/Login';
import { Register } from '../components/Pages/Register/Register';
import { Settings } from '../components/Pages/Settings/Settings';
import { NewArticle } from '../components/Pages/NewArticle/NewArticle';
import { EditArticle } from '../components/Pages/EditArticle/EditArticle';
import { ProfilePage } from '../components/Pages/ProfilePage/ProfilePage';
import { FC, PropsWithChildren } from 'react';
import { useUser } from '../rules/user/useUser';

export function App() {
  const { loading } = useStoreWithInitializer(({ app }) => app, load);
  const user = useUser();
  const userIsLogged = user !== undefined;
  return (
    <>
      {!loading && (
        <>
          <Header />
          <HashRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/settings"
                element={
                  <UserOnlyRoute userIsLogged={userIsLogged}>
                    <Settings />
                  </UserOnlyRoute>
                }
              />
              <Route
                path="/editor"
                element={
                  <UserOnlyRoute userIsLogged={userIsLogged}>
                    <NewArticle />
                  </UserOnlyRoute>
                }
              />
              <Route
                path="/editor/:slug"
                element={
                  <UserOnlyRoute userIsLogged={userIsLogged}>
                    <EditArticle />
                  </UserOnlyRoute>
                }
              />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/article/:slug" element={<ArticlePage />} />
              <Route path="/" element={<Home />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </HashRouter>
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

const UserOnlyRoute: FC<PropsWithChildren<{ userIsLogged: boolean }>> = ({
  userIsLogged,
  children,
}) => {
  if (!userIsLogged) return <Navigate to={'/'} />;
  else return <>{children}</>;
};
