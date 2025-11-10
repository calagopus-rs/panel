import { faTableCellsLarge, faTableList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import getServers from '@/api/server/getServers';
import Switch from '@/elements/input/Switch';
import Spinner from '@/elements/Spinner';
import { load } from '@/lib/debounce';
import { useAuth } from '@/providers/AuthProvider';
import { useGlobalStore } from '@/stores/global';
import ServerItem from './ServerItem';

export default function DashboardHome() {
  const { serverListDesign, serverListShowOthers, setServerListDesign, setServerListShowOthers } = useGlobalStore();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [servers, setServers] = useState<Server[]>([]);

  useEffect(() => {
    getServers(serverListShowOthers).then((response) => {
      load(false, setLoading);
      setServers(response.data);
    });
  }, [serverListShowOthers]);

  return (
    <>
      <div className={'justify-between flex items-center mb-2'}>
        <h1 className={'text-4xl font-bold text-white'}>Servers</h1>
        <div className={'flex items-center gap-2'}>
          {user.admin && (
            <Switch
              label={"Show other users' servers"}
              checked={serverListShowOthers}
              onChange={(e) => setServerListShowOthers(e.currentTarget.checked)}
            />
          )}
          <FontAwesomeIcon
            className={classNames('p-2 rounded-full cursor-pointer', [
              serverListDesign === 'grid' ? 'bg-neutral-700 text-cyan-500' : 'bg-neutral-600 text-neutral-300',
            ])}
            size={'lg'}
            icon={faTableCellsLarge}
            onClick={() => setServerListDesign('grid')}
          />
          <FontAwesomeIcon
            className={classNames('p-2 rounded-full cursor-pointer', [
              serverListDesign === 'row' ? 'bg-neutral-700 text-cyan-500' : 'bg-neutral-600 text-neutral-300',
            ])}
            size={'lg'}
            icon={faTableList}
            onClick={() => setServerListDesign('row')}
          />
        </div>
      </div>
      {loading ? (
        <Spinner.Centered />
      ) : servers.length === 0 ? (
        <p className={'text-gray-400'}>No servers found</p>
      ) : (
        <div className={classNames('gap-4', [serverListDesign === 'grid' ? 'grid md:grid-cols-2' : 'flex flex-col'])}>
          {servers.map((server) => (
            <ServerItem key={server.uuid} server={server} />
          ))}
        </div>
      )}
    </>
  );
}
