import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import {
  faClock,
  faCloudDownload,
  faCloudUpload,
  faEthernet,
  faHardDrive,
  faMemory,
  faMicrochip,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function ServerConsole() {
  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Server Console</h1>
        <div className="flex gap-2">
          <Button style={Button.Styles.Green}>Start</Button>
          <Button style={Button.Styles.Gray}>Restart</Button>
          <Button style={Button.Styles.Red}>Stop</Button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="col-span-3 bg-red-500 h-full">Console</div>
        <div className="col-span-1 grid gap-4">
          <StatCard icon={faEthernet} label="Address" value="127.0.0.1" />
          <StatCard icon={faClock} label="Uptime" value="1h 5m" />
          <StatCard icon={faMicrochip} label="CPU Load" value="3.00%" limit="100%" />
          <StatCard icon={faMemory} label="Memory Load" value="2.00 GiB" limit="4.00 GiB" />
          <StatCard icon={faHardDrive} label="Disk Usage" value="20.00 GiB" limit="100.00 GiB" />
          <StatCard icon={faCloudDownload} label="Network (In)" value="100 MiB" />
          <StatCard icon={faCloudUpload} label="Network (Out)" value="20 TiB" />
        </div>
      </div>
      <div className="bg-green-500 h-48">Stats</div>
    </Container>
  );
}

function StatCard({
  icon,
  label,
  value,
  limit,
}: {
  icon: IconDefinition;
  label: string;
  value: string;
  limit?: string;
}) {
  return (
    <div className="bg-gray-600 p-4 rounded flex gap-4">
      <FontAwesomeIcon className="text-gray-100 bg-gray-500 p-4 rounded-lg" size={'xl'} icon={icon} />
      <div className="flex flex-col">
        <span className="text-sm text-gray-400 font-bold">{label}</span>
        <span className="text-lg font-bold">
          {value} {limit && <span className="text-sm text-gray-400">/ {limit}</span>}
        </span>
      </div>
    </div>
  );
}
