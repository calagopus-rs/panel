import Container from '@/elements/Container';
import { faTableCellsLarge, faTableList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import ServerItem from './ServerItem';
import getServers from '@/api/server/getServers';
import Spinner from '@/elements/Spinner';
import { useGlobalStore } from '@/stores/global';

export default () => {
  const { serverListDesign, setServerListDesign } = useGlobalStore();

  const [loading, setLoading] = useState(true);
  const [servers, setServers] = useState<ApiServer[]>([]);

  useEffect(() => {
    getServers().then(response => {
      setLoading(false);
      setServers(response.data);
    });
  }, []);

  return (
    <Container>
      <div className="justify-between flex items-center mb-2">
        <h1 className="text-4xl font-bold text-white">Servers</h1>
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
      {loading ? (
        <Spinner.Centered />
      ) : servers.length === 0 ? (
        <p className="text-gray-400">No servers found</p>
      ) : (
        <div className={classNames('gap-4', [serverListDesign === 'grid' ? 'grid md:grid-cols-2' : 'flex flex-col'])}>
          {servers.map(server => (
            <ServerItem key={server.uuid} server={server} />
          ))}
        </div>
      )}
    </Container>
  );
};
