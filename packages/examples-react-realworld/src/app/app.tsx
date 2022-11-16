import { Footer } from '../components/atoms/Footer/Footer';
import { Home } from '../components/Pages/Home/Home';
import { ArticlePage } from '../components/Pages/ArticlePage/ArticlePage';
import { Header } from '../components/molecules/Header/Header';
import { Login } from '../components/Pages/Login/Login';
import { Register } from '../components/Pages/Register/Register';
import { Settings } from '../components/Pages/Settings/Settings';
import { NewArticle } from '../components/Pages/NewArticle/NewArticle';
import { EditArticle } from '../components/Pages/EditArticle/EditArticle';
import { ProfilePage } from '../components/Pages/ProfilePage/ProfilePage';
import { FC, PropsWithChildren } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useUser } from '../rules/user/useUser';

export function App() {
  const userIsLogged = !!useUser();
  return (
    <>
      <Header />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="settings"
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
        <Route path="/profile/:username" element={<ProfilePage />}>
          <Route path={'favorites'} element={<ProfilePage />} />
        </Route>
        <Route path="/article/:slug" element={<ArticlePage />} />
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </>
  );
}

const UserOnlyRoute: FC<PropsWithChildren<{ userIsLogged: boolean }>> = ({
  userIsLogged,
  children,
}) => {
  if (!userIsLogged) return <Navigate to={'/'} />;
  else return <>{children}</>;
};
