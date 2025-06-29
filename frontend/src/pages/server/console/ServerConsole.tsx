import Container from '@/elements/Container';
import Console from './Console';
import Spinner from '@/elements/Spinner';
import ServerDetails from './ServerDetails';
import ServerPowerControls from './ServerPowerControls';
import ServerStats from './ServerStats';
import { useServerStore } from '@/stores/server';

export default () => {
  const server = useServerStore(state => state.data);

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">{server.name}</h1>
        <ServerPowerControls />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="col-span-3 h-full">
          <Spinner.Suspense>
            <Console />
          </Spinner.Suspense>
        </div>

        <Spinner.Suspense>
          <ServerDetails />
        </Spinner.Suspense>
      </div>
      <div className="h-48">
        <ServerStats />
      </div>
    </Container>
  );
};
