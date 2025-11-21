import { ReactNode, useRef } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Container({ children }: LayoutProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className='flex flex-col justify-between min-w-full h-full px-4 lg:px-12'>
      <div ref={bodyRef} className='mb-4 lg:mt-12'>
        {children}
      </div>
    </div>
  );
}
