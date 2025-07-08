import { NavLink } from 'react-router';
import styles from './subnavigation.module.css';

export const SubNavigation = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.subnavigation}>{children}</div>;
};

interface Props {
  to: string;
  name: string;
}

interface PropsWithIcon extends Props {
  icon: React.ComponentType;
  children?: never;
}

interface PropsWithoutIcon extends Props {
  icon?: never;
  children: React.ReactNode;
}

export const SubNavigationLink = ({ to, name, icon: IconComponent, children }: PropsWithIcon | PropsWithoutIcon) => (
  <NavLink to={to} end>
    {IconComponent ? <IconComponent /> : children}
    {name}
  </NavLink>
);
