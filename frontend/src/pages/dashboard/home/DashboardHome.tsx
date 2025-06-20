import { PaginatedResult } from '@/api/axios';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import { useSettingsStore } from '@/stores/settings';
import { faTableCellsLarge, faTableList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { use } from 'react';
import ServerItem from './ServerItem';
import { Server } from '@/api/types';
import { getServers } from '@/api/server/getServers';

function ServerItems({ serverListPromise }: { serverListPromise: Promise<PaginatedResult<Server>> }) {
  const { serverListDesign } = useSettingsStore(state => state);
  const serverList = use(serverListPromise);

  return (
    <div className={classNames('gap-4', [serverListDesign === 'grid' ? 'grid md:grid-cols-2' : 'flex flex-col'])}>
      {serverList.items.map(server => (
        <ServerItem key={server.id} server={server} />
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const { serverListDesign, setServerListDesign } = useSettingsStore(state => state);
  const serverListPromise = getServers();

  return (
    <Container>
      <div className="justify-between flex items-center mb-2">
        <h1 className="text-4xl font-header font-bold text-white">Servers</h1>
        <div className="flex gap-2">
          <FontAwesomeIcon
            className={classNames('p-2 rounded-full cursor-pointer', [
              serverListDesign === 'grid' ? 'bg-neutral-700 text-cyan-500' : 'bg-neutral-600 text-neutral-300',
            ])}
            size="lg"
            icon={faTableCellsLarge}
            onClick={() => setServerListDesign('grid')}
          />
          <FontAwesomeIcon
            className={classNames('p-2 rounded-full cursor-pointer', [
              serverListDesign === 'row' ? 'bg-neutral-700 text-cyan-500' : 'bg-neutral-600 text-neutral-300',
            ])}
            size="lg"
            icon={faTableList}
            onClick={() => setServerListDesign('row')}
          />
        </div>
      </div>
      <Spinner.Suspense>
        <ServerItems serverListPromise={serverListPromise} />
      </Spinner.Suspense>
    </Container>
  );
}
