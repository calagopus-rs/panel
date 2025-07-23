import { NavLink } from 'react-router';
import classNames from 'classnames';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const SubNavigation = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={'flex flex-row items-center flex-shrink-0 h-12 mb-4 border-b border-neutral-700'}>{children}</div>
  );
};

interface Props {
  to: string;
  name: string;
  icon: IconDefinition;
}

export const SubNavigationLink = ({ to, name, icon }: Props) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      classNames(
        isActive && 'text-cyan-300! border-cyan-300!',
        'flex flex-row items-center h-full px-4 border-b text-neutral-300 text-base whitespace-nowrap border-transparent',
      )
    }
  >
    <FontAwesomeIcon icon={icon} className={'w-6 h-6 mr-2'} />
    {name}
  </NavLink>
);
