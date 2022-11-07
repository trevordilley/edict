import { Fragment } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { User } from '../../types/user';
import { useUser } from '../../rules/user/useUser';

export function Header() {
  const user = useUser();

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <a className="navbar-brand" href="/#/">
          conduit
        </a>
        <ul className="nav navbar-nav pull-xs-right">
          <NavItem text="Home" href="/" />
          {user ? <UserLinks user={user} /> : <GuestLinks />}
        </ul>
      </div>
      <Outlet />
    </nav>
  );
}

function NavItem({
  text,
  href,
  icon,
}: {
  text: string;
  href: string;
  icon?: string;
}) {
  return (
    <li className="nav-item">
      <NavLink
        to={href}
        className={(navData) =>
          navData.isActive ? 'active nav-link' : 'nav-link'
        }
      >
        {icon && <i className={icon}></i>}&nbsp;
        {text}
      </NavLink>
    </li>
  );
}

function GuestLinks() {
  return (
    <Fragment>
      <NavItem text="Sign in" href="/login" />
      <NavItem text="Sign up" href="/register" />
    </Fragment>
  );
}

function UserLinks({ user: { username } }: { user: User }) {
  return (
    <Fragment>
      <NavItem text="New Article" href="/editor" icon="ion-compose" />
      <NavItem text="Settings" href="/settings" icon="ion-gear-a" />
      <NavItem text={`${username}`} href={`/profile/${username}`} />
    </Fragment>
  );
}
