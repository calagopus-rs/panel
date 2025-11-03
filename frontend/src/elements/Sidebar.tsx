import { NavLink } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Card from '@/elements/Card';
import { faArrowRightFromBracket, faBars, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useState, useEffect } from 'react';
import { ActionIcon } from '@mantine/core';
import Button from '@/elements/Button';
import Badge from '@/elements/Badge';
import MantineDivider from '@/elements/Divider';
import Drawer from '@/elements/Drawer';
import CloseButton from '@/elements/CloseButton';
import { useGlobalStore } from '@/stores/global';

type SidebarProps = {
  children: React.ReactNode;
};

function Sidebar({ children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <Card className={'lg:hidden! flex-row! justify-end -ml-1 mt-4 mb-4 w-16'} p={'xs'}>
        <ActionIcon onClick={() => setIsMobileMenuOpen(true)} variant={'subtle'}>
          <FontAwesomeIcon size={'lg'} icon={faBars} />
        </ActionIcon>
      </Card>

      <Drawer
        opened={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        withCloseButton={false}
        maw={'16rem'}
        styles={{ body: { height: '100%' } }}
      >
        <CloseButton size={'xl'} className={'absolute! right-4 z-10'} onClick={() => setIsMobileMenuOpen(false)} />

        <div className={'h-full flex flex-col'}>{children}</div>
      </Drawer>

      <Card className={'mt-2 top-2 left-2 sticky! hidden! lg:block! h-[calc(100vh-1rem)] w-64!'} p={'sm'}>
        <div className={'h-full flex flex-col'}>{children}</div>
      </Card>
    </>
  );
}

type LinkProps = {
  to: string;
  end?: boolean;
  icon: IconDefinition;
  name: string;
  title?: string;
};

function Link({ to, end, icon, name, title = name }: LinkProps) {
  const { settings } = useGlobalStore();

  return (
    <NavLink to={to} end={end} className={'w-full'}>
      {({ isActive }) => {
        if (isActive) {
          document.title = `${title} | ${settings.app.name}`;
        }

        return (
          <Button
            color={isActive ? 'blue' : 'gray'}
            className={isActive ? 'cursor-default!' : undefined}
            variant={'subtle'}
            fullWidth
            styles={{ label: { width: '100%' } }}
          >
            <FontAwesomeIcon icon={icon} className={'mr-2'} /> {name}
          </Button>
        );
      }}
    </NavLink>
  );
}

function Divider() {
  return <MantineDivider className={'my-2'} />;
}

function Footer() {
  const { user, doLogout } = useAuth();

  return (
    <Card className={'mt-auto flex-row! justify-between items-center'} p={'sm'}>
      <NavLink to={'/account'}>
        <div className={'flex items-center'}>
          <img
            src={user.avatar ?? '/icon.svg'}
            alt={'Profile Picture'}
            className={'h-10 w-10 rounded-full select-none'}
          />
          <div className={'flex flex-col ml-3'}>
            <span
              className={'font-sans font-normal text-sm text-neutral-50 whitespace-nowrap leading-tight select-none'}
            >
              {user.nameFirst}
            </span>
            {user.admin && (
              <Badge size={'xs'} className={'select-none cursor-pointer!'}>
                Admin
              </Badge>
            )}
          </div>
        </div>
      </NavLink>
      <ActionIcon color={'red'} variant={'subtle'} onClick={doLogout}>
        <FontAwesomeIcon icon={faArrowRightFromBracket} />
      </ActionIcon>
    </Card>
  );
}

Sidebar.Link = Link;
Sidebar.Divider = Divider;
Sidebar.Footer = Footer;

export default Sidebar;
