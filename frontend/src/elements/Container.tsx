import { useGlobalStore } from '@/stores/global';
import { FC, ReactNode, useRef } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const { settings } = useGlobalStore();
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className='flex flex-col justify-between min-w-full h-full px-4 lg:px-12'>
      <div ref={bodyRef} className={'mb-4 lg:mt-12'}>
        {children}
      </div>
      <div className='mb-3 text-xs transition-all text-gray-400'>
        <span>
          <a
            href={'https://github.com/calagopus-rs/panel'}
            target={'_blank'}
            rel={'noopener noreferrer'}
            className={'underline'}
          >
            Calagopus
          </a>
          @{settings.version}
          <br />
          copyright © 2025 - {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
};

export default Layout;
