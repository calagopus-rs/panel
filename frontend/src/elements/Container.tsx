import { ReactNode, useRef } from 'react';

interface LayoutProps {
  children: ReactNode;
  isNormal: boolean;
}

export default function Container({ children, isNormal }: LayoutProps) {
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
    </div>
  );
}
