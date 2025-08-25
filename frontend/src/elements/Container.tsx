import { useGlobalStore } from '@/stores/global';
import classNames from 'classnames';
import React, { useState, useEffect, useRef } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { settings } = useGlobalStore();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);

  const checkIfBottomReached = () => {
    if (!bodyRef.current) return;

    const scrollContainer = document.documentElement;
    const scrollPosition = window.scrollY;
    const viewportHeight = window.innerHeight;

    const distanceFromBottom = scrollContainer.scrollHeight - (scrollPosition + viewportHeight);

    setHasReachedBottom(distanceFromBottom <= 0);
  };

  useEffect(() => {
    checkIfBottomReached();

    window.addEventListener('scroll', checkIfBottomReached);
    window.addEventListener('resize', checkIfBottomReached);

    const resizeObserver = new ResizeObserver(() => {
      checkIfBottomReached();
    });

    if (bodyRef.current) {
      resizeObserver.observe(bodyRef.current);
    }

    return () => {
      window.removeEventListener('scroll', checkIfBottomReached);
      window.removeEventListener('resize', checkIfBottomReached);
      resizeObserver.disconnect();
    };
  }, [bodyRef]);

  return (
    <div>
      <div ref={bodyRef} className={'mb-4 lg:my-12 px-4 lg:px-12 mx-auto'}>
        {children}
      </div>
      <span
        className={classNames(
          'fixed ml-3 text-xs transition-all text-gray-400',
          hasReachedBottom ? 'bottom-2' : '-bottom-12',
        )}
      >
        <a
          href={'https://github.com/pterodactyl-rs/panel'}
          target={'_blank'}
          rel={'noopener noreferrer'}
          className={'underline'}
        >
          github.com/pterodactyl-rs/panel
        </a>
        @{settings.version}
        <br />
        copyright © 2025 - {new Date().getFullYear()}
      </span>
    </div>
  );
};

export default Layout;
