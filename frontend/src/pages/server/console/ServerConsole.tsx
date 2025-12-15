import { Group, Title } from '@mantine/core';
import debounce from 'debounce';
import { useEffect, useRef, useState } from 'react';
import Can from '@/elements/Can.tsx';
import { useServerStore } from '@/stores/server.ts';
import Console from './Console.tsx';
import ServerDetails from './ServerDetails.tsx';
import ServerPowerControls from './ServerPowerControls.tsx';
import ServerStats from './ServerStats.tsx';

export default function ServerConsole() {
  const server = useServerStore((state) => state.server);

  const [maxConsoleHeight, setMaxConsoleHeight] = useState<number | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statsRef.current) {
      setMaxConsoleHeight(statsRef.current.clientHeight);

      const handleResize = debounce(() => {
        setMaxConsoleHeight(statsRef.current?.clientHeight || null);
      }, 100);

      const observer = new ResizeObserver(handleResize);
      observer.observe(statsRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [statsRef.current]);

  return (
    <>
      <Group justify='space-between' mb='md'>
        <div className='flex flex-col'>
          <Title order={1} c='white'>
            {server.name}
          </Title>
          <p className='text-sm text-gray-300!'>{server.description}</p>
        </div>
        <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
          <ServerPowerControls />
        </Can>
      </Group>

      <div className='grid xl:grid-cols-4 gap-4 mb-4'>
        <div className='xl:col-span-3' style={{ height: maxConsoleHeight ?? 0 }}>
          <Console />
        </div>

        <div className='h-fit' ref={statsRef}>
          <ServerDetails />
        </div>
      </div>

      <ServerStats />
    </>
  );
}
