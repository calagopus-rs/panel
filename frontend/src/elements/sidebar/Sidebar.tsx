import classNames from 'classnames';
import styles from './sidebar.module.css';
import { NavLink } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { ActionIcon } from '@mantine/core';

type SidebarProps = {
  collapsed?: boolean;
  children: React.ReactNode;
};

function Sidebar({ collapsed = false, children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <>
      <div className={'lg:hidden my-4 ml-4'}>
        <ActionIcon onClick={() => setIsMobileMenuOpen(true)}>
          <FontAwesomeIcon icon={faBars} />
        </ActionIcon>
      </div>

      <Transition show={isMobileMenuOpen} as={Fragment}>
        <Dialog as={'div'} className={'relative z-50 lg:hidden'} onClose={setIsMobileMenuOpen}>
          <TransitionChild
            as={Fragment}
            enter={'ease-in-out duration-300'}
            enterFrom={'opacity-0'}
            enterTo={'opacity-100'}
            leave={'ease-in-out duration-300'}
            leaveFrom={'opacity-100'}
            leaveTo={'opacity-0'}
          >
            <div
              className={'fixed inset-0 bg-black bg-opacity-25 transition-opacity'}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          </TransitionChild>

          <div className={'fixed inset-0 overflow-hidden'}>
            <div className={'absolute inset-0 overflow-hidden'}>
              <div className={'pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10'}>
                <TransitionChild
                  as={Fragment}
                  enter={'transform transition ease-in-out duration-300'}
                  enterFrom={'-translate-x-full'}
                  enterTo={'translate-x-0'}
                  leave={'transform transition ease-in-out duration-300'}
                  leaveFrom={'translate-x-0'}
                  leaveTo={'-translate-x-full'}
                >
                  <DialogPanel className={'pointer-events-auto w-screen max-w-md'}>
                    <div className={'flex h-full flex-col bg-neutral-900'}>
                      <div className={'flex items-center justify-end px-4 py-3 border-b border-neutral-700'}>
                        <ActionIcon onClick={() => setIsMobileMenuOpen(false)}>
                          <FontAwesomeIcon icon={faXmark} />
                        </ActionIcon>
                      </div>
                      {children}
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      <div className={classNames(styles.sidebar, { [styles.sidebarCollapsed]: collapsed })}>{children}</div>
    </>
  );
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
  const { user } = useAuth();
  const { doLogout } = useAuth();

  return (
    <div className={styles.user}>
      <div className={'flex items-center'}>
        <img
          src={user.avatar ?? '/icon.svg'}
          alt={'Profile Picture'}
          className={'h-10 w-10 rounded-full select-none'}
        />

        <div className={'flex flex-col ml-3'}>
          <span className={'font-sans font-normal text-sm text-neutral-50 whitespace-nowrap leading-tight select-none'}>
            {user.nameFirst}
          </span>
          {user.admin && (
            <span className={'font-normal text-xs text-neutral-300 whitespace-nowrap leading-tight select-none'}>
              Admin
            </span>
          )}
        </div>
      </div>
      <ActionIcon color={'red'} onClick={doLogout}>
        <FontAwesomeIcon icon={faArrowRightFromBracket} />
      </ActionIcon>
    </div>
  );
}

Sidebar.Section = Section;
Sidebar.Wrapper = Wrapper;
Sidebar.Link = Link;
Sidebar.User = User;

export default Sidebar;
