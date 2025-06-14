import classNames from 'classnames';
import styles from './sidebar.module.css';

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

function User({ children }: { children: React.ReactNode }) {
  return <div className={styles.user}>{children}</div>;
}

Sidebar.Section = Section;
Sidebar.Wrapper = Wrapper;
Sidebar.User = User;

export default Sidebar;
