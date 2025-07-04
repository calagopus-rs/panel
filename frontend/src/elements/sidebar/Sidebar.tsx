import classNames from 'classnames';
import styles from './sidebar.module.css';
import { NavLink } from 'react-router';
import { useUserStore } from '@/stores/user';
import { Button } from '../button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import logout from '@/api/me/logout';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';

type SidebarProps = {
  collapsed?: boolean;
  children: React.ReactNode;
};

function Sidebar({ collapsed = false, children }: SidebarProps) {
  return <div className={classNames(styles.sidebar, { [styles.sidebarCollapsed]: collapsed })}>{children}</div>;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className={styles.wrapper}>{children}</div>;
}

function Section({ children }: { children?: React.ReactNode }) {
  return <div className={styles.section}>{children}</div>;
}

type LinkProps = {
  to: string;
  end?: boolean;
  children: React.ReactNode;
};

function Link({ to, end, children }: LinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => classNames(styles.navLink, { [styles.activeLink]: isActive })}
    >
      {children}
    </NavLink>
  );
}

function User() {
  const { user, setUser } = useUserStore();
  const { addToast } = useToast();
  const avatarURL = 'https://placehold.co/400x400/png';

  const doLogout = () => {
    logout()
      .then(() => {
        setUser(null);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <div className={styles.user}>
      <div className="flex items-center">
        {avatarURL && (
          <img src={`${avatarURL}?s=64`} alt="Profile Picture" className="h-10 w-10 rounded-full select-none" />
        )}
        <div className="flex flex-col ml-3">
          <span className="font-sans font-normal text-sm text-neutral-50 whitespace-nowrap leading-tight select-none">
            {user.name_first}
          </span>
          <span className="font-normal text-xs text-neutral-300 whitespace-nowrap leading-tight select-none">
            Admin
          </span>
        </div>
      </div>
      <Button
        style={Button.Styles.Red}
        shape={Button.Shapes.IconSquare}
        variant={Button.Variants.Secondary}
        onClick={doLogout}
      >
        <FontAwesomeIcon icon={faArrowRightFromBracket} />
      </Button>
    </div>
  );
}

Sidebar.Section = Section;
Sidebar.Wrapper = Wrapper;
Sidebar.Link = Link;
Sidebar.User = User;

export default Sidebar;
