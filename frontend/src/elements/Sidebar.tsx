import { faArrowRightFromBracket, faBars, faUserCog, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { MouseEvent as ReactMouseEvent, ReactNode, startTransition, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import Badge from '@/elements/Badge';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import CloseButton from '@/elements/CloseButton';
import MantineDivider from '@/elements/Divider';
import Drawer from '@/elements/Drawer';
import { useAuth } from '@/providers/AuthProvider';
import { useGlobalStore } from '@/stores/global';
import Tooltip from './Tooltip';

type SidebarProps = {
  children: ReactNode;
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

        <div className={'h-full flex flex-col overflow-y-auto'}>{children}</div>
      </Drawer>

      <Card className={'mt-2 top-2 left-2 sticky! hidden! lg:block! h-[calc(100vh-1rem)] w-64!'} p={'sm'}>
        <div className={'h-full flex flex-col overflow-y-auto'}>{children}</div>
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
  const navigate = useNavigate();
  const { settings } = useGlobalStore();

  const doNavigate = (e: ReactMouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      navigate(to);
    });
  };

  return (
    <NavLink to={to} end={end} onClick={doNavigate} className={'w-full'}>
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
  const { settings } = useGlobalStore();

  return (
    <>
      <Card className={'mt-auto flex-row! justify-between items-center min-h-fit'} p={'sm'}>
        <div className={'flex items-center'}>
          <img src={user.avatar ?? '/icon.svg'} alt={user.username} className={'h-10 w-10 rounded-full select-none'} />
          <div className={'flex flex-col ml-3'}>
            <span className={'font-sans font-normal text-sm text-neutral-50 whitespace-nowrap leading-tight'}>
              {user.nameFirst}
            </span>
            {user.admin && <Badge size={'xs'}>Admin</Badge>}
          </div>
        </div>

        <div className={'flex flex-row items-center space-x-2'}>
          <NavLink to={'/account'} end>
            {({ isActive }) => (
              <ActionIcon variant={'subtle'} disabled={isActive}>
                <FontAwesomeIcon icon={faUserCog} />
              </ActionIcon>
            )}
          </NavLink>
          <ActionIcon color={'red'} variant={'subtle'} onClick={doLogout}>
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </ActionIcon>
        </div>
      </Card>

      <div className={'mt-2 text-xs transition-all text-gray-400'}>
        <span className={'flex flex-row justify-between'}>
          <Tooltip label={settings.version}>
            <a
              href={'https://github.com/calagopus-rs/panel'}
              target={'_blank'}
              rel={'noopener noreferrer'}
              className={'underline'}
            >
              Calagopus
            </a>
          </Tooltip>
          © 2025 - {new Date().getFullYear()}
        </span>
      </div>
    </>
  );
}

Sidebar.Link = Link;
Sidebar.Divider = Divider;
Sidebar.Footer = Footer;

export default Sidebar;
