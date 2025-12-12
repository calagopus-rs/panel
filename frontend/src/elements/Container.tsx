import { useGlobalStore } from '@/stores/global';
import { ReactNode, useRef } from 'react';
import Tooltip from './Tooltip';

interface LayoutProps {
  children: ReactNode;
  isNormal: boolean;
}

export default function Container({ children, isNormal }: LayoutProps) {
  const { settings } = useGlobalStore();
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={
        isNormal
          ? 'flex flex-col justify-between min-w-full h-full px-4 lg:px-12'
          : 'flex flex-col justify-between h-full overflow-auto p-4'
      }
    >
      <div ref={bodyRef} className={isNormal ? 'mb-4 lg:mt-12' : 'mb-4'}>
        {children}
      </div>
      <div className='my-2 text-xs transition-all text-gray-400'>
        <span className='flex flex-row justify-end gap-2'>
          <Tooltip label={settings.version}>
            <a
              href='https://github.com/calagopus-rs/panel'
              target='_blank'
              rel='noopener noreferrer'
              className='underline'
            >
              Calagopus
            </a>
          </Tooltip>
          {new Date().getFullYear() === 2025 ? `© 2025` : `© 2025 - ${new Date().getFullYear()}`}
        </span>
      </div>
    </div>
  );
}
