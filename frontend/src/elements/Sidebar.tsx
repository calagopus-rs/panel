import { faArrowRightFromBracket, faBars, faUserCog, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { MouseEvent as ReactMouseEvent, ReactNode, startTransition, useEffect, useState } from 'react';
import { MemoryRouter, NavLink, useNavigate } from 'react-router';
import Badge from '@/elements/Badge.tsx';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import CloseButton from '@/elements/CloseButton.tsx';
import MantineDivider from '@/elements/Divider.tsx';
import Drawer from '@/elements/Drawer.tsx';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useWindows } from '@/providers/WindowProvider.tsx';
import RouterRoutes from '@/RouterRoutes.tsx';

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
      <Card className='lg:hidden! sticky! top-5 z-1 flex-row! justify-end -ml-1 my-4 w-16 rounded-l-none!' p='xs'>
        <ActionIcon onClick={() => setIsMobileMenuOpen(true)} variant='subtle'>
          <FontAwesomeIcon size='lg' icon={faBars} />
        </ActionIcon>
      </Card>

      <Drawer
        opened={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        withCloseButton={false}
        maw='16rem'
        styles={{ body: { height: '100%' } }}
      >
        <CloseButton size='xl' className='absolute! right-4 z-10' onClick={() => setIsMobileMenuOpen(false)} />

        <div className='h-full flex flex-col overflow-y-auto'>{children}</div>
      </Drawer>

      <Card className='mt-2 top-2 left-2 sticky! hidden! lg:block! h-[calc(100vh-1rem)] w-64!' p='sm'>
        <div className='h-full flex flex-col overflow-y-auto'>{children}</div>
      </Card>
    </>
  );
}

type LinkProps = {
  to: string;
  end?: boolean;
  icon?: IconDefinition;
  name?: string;
  title?: string;
};

function Link({ to, end, icon, name, title = name }: LinkProps) {
  const navigate = useNavigate();
  const { addWindow } = useWindows();

  const doNavigate = (e: ReactMouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      navigate(to);
    });
  };

  const doOpenWindow = (e: ReactMouseEvent) => {
    e.preventDefault();
    addWindow(
      icon,
      title,
      <MemoryRouter initialEntries={[to]}>
        <RouterRoutes isNormal={false} />
      </MemoryRouter>,
    );
  };

  return (
    <NavLink to={to} end={end} onClick={doNavigate} onContextMenu={doOpenWindow} className='w-full'>
      {({ isActive }) => (
        <Button
          color={isActive ? 'blue' : 'gray'}
          className={isActive ? 'cursor-default!' : undefined}
          variant='subtle'
          fullWidth
          styles={{ label: { width: '100%' } }}
        >
          {icon && <FontAwesomeIcon icon={icon} className='mr-2' />} {name}
        </Button>
      )}
    </NavLink>
  );
}

function Divider() {
  return <MantineDivider className='my-2' />;
}

function Footer() {
  const { t } = useTranslations();
  const { user, doLogout } = useAuth();

  return (
    <>
      <div className='mt-auto'>
        <Divider />
      </div>

      <div className='p-2 flex flex-row justify-between items-center min-h-fit'>
        <div className='flex items-center'>
          <img src={user!.avatar ?? '/icon.svg'} alt={user!.username} className='h-10 w-10 rounded-full select-none' />
          <div className='flex flex-col ml-3'>
            <span className='font-sans font-normal text-sm text-neutral-50 whitespace-nowrap leading-tight lg:w-25 overflow-hidden text-ellipsis'>
              {user!.username}
            </span>
            {user!.admin && (
              <NavLink to='/admin' className='cursor-pointer!'>
                <Badge size='xs' className='cursor-pointer!'>
                  {t('pages.account.admin.title', {})}
                </Badge>
              </NavLink>
            )}
          </div>
        </div>

        <div className='flex flex-row items-center space-x-2'>
          <NavLink to='/account' end>
            {({ isActive }) => (
              <ActionIcon variant='subtle' disabled={isActive}>
                <FontAwesomeIcon icon={faUserCog} />
              </ActionIcon>
            )}
          </NavLink>
          <ActionIcon color='red' variant='subtle' onClick={doLogout}>
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </ActionIcon>
        </div>
      </div>
    </>
  );
}

Sidebar.Link = Link;
Sidebar.Divider = Divider;
Sidebar.Footer = Footer;

export default Sidebar;
