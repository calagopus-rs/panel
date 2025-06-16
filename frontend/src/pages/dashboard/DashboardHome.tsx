import Container from '@/elements/Container';
import { faHardDrive, faMemory, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';

export default function DashboardHome() {
  return (
    <Container>
      <div className="grid md:grid-cols-2 gap-4">
        <FakeServer name={'My SMP Server'} status={'Online'} />
        <FakeServer name={'Cheap stuff'} status={'Offline'} />
        <FakeServer name={'This is a very long server name that should exceed the div boundary'} status={'Offline'} />
        <FakeServer name={'Server'} status={'Online'} />
      </div>
    </Container>
  );
}

function FakeServer({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex flex-col bg-gray-700 outline-2 outline-transparent hover:outline-gray-400 transition-colors duration-200 rounded">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xl font-header font-medium truncate" title={name}>
            {name}
          </span>
          <div
            className={classNames(
              'rounded-full px-2 py-1 text-xs flex items-center gap-1',
              status === 'Online' ? 'bg-emerald-400/30' : 'bg-rose-400/30',
            )}
          >
            <div
              className={classNames('size-2 rounded-full', status === 'Online' ? 'bg-emerald-500' : 'bg-rose-500')}
            ></div>
            <span>{status}</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">localhost:8000</p>
      </div>
      <div className="rounded-b-md p-4 grid gap-2 sm:grid-cols-3 bg-gray-800/50">
        <div className="flex gap-2 text-sm justify-center items-center">
          <FontAwesomeIcon icon={faMicrochip} className="size-5 flex-none" />
          <div>
            <span className="mr-1">0.0%</span>
            <span className="inline-block text-xs text-gray-400">/ 100%</span>
          </div>
        </div>
        <div className="flex gap-2 text-sm justify-center items-center">
          <FontAwesomeIcon icon={faMemory} className="size-5 flex-none" />
          <div>
            <span className="mr-1">0 Bytes</span>
            <span className="inline-block text-xs text-gray-400">/ 4 GiB</span>
          </div>
        </div>
        <div className="flex gap-2 text-sm justify-center items-center">
          <FontAwesomeIcon icon={faHardDrive} className="size-5 flex-none" />
          <div>
            <span className="mr-1">0.00 MiB</span>
            <span className="inline-block text-xs text-gray-400">/ 4 GiB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
