import Container from '@/elements/Container';
import Console from './Console';
import Spinner from '@/elements/Spinner';
import ServerDetails from './ServerDetails';
import ServerPowerControls from './ServerPowerControls';
import ServerStats from './ServerStats';
import { useServerStore } from '@/stores/server';
import Can from '@/elements/Can';

export default () => {
  const server = useServerStore((state) => state.server);

  return (
    <Container>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>{server.name}</h1>
        <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
          <ServerPowerControls />
        </Can>
      </div>
      <div className={'grid xl:grid-cols-4 gap-4 mb-4'}>
        <div className={'xl:col-span-3 h-full'}>
          <Spinner.Suspense>
            <Console />
          </Spinner.Suspense>
        </div>

        <Spinner.Suspense>
          <ServerDetails />
        </Spinner.Suspense>
      </div>
      <div className={'h-48'}>
        <ServerStats />
      </div>
    </Container>
  );
};
