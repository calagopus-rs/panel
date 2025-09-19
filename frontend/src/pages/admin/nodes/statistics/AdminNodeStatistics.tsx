import { axiosInstance, httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { Group, Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import SemiCircleProgress from '@/elements/SemiCircleProgress';
import Card from '@/elements/Card';
import { bytesToString } from '@/lib/size';

interface NodeStatistics {
  cpu: {
    used: number;
    threads: number;
    model: string;
  };
  network: {
    received: number;
    receivingRate: number;
    sent: number;
    sendingRate: number;
  };
  memory: {
    used: number;
    total: number;
  };
  disk: {
    used: number;
    total: number;
    read: number;
    readingRate: number;
    written: number;
    writingRate: number;
  };
}

export default ({ node }: { node: Node }) => {
  const { addToast } = useToast();

  const [statistics, setStatistics] = useState<NodeStatistics | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      axiosInstance
        .get(`${new URL(node.publicUrl ?? node.url).origin}/api/stats`, {
          headers: {
            Authorization: `Bearer ${node.token}`,
          },
        })
        .then(({ data }) => {
          setStatistics(data);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Title order={2}>
        Node Statistics
      </Title>

      {!statistics ? (
        <Spinner.Centered />
      ) : (
        <div className={'grid grid-cols-1 xl:grid-cols-3 gap-4'}>
          <Card className={'flex !flex-row'}>
            <SemiCircleProgress
              value={statistics.cpu.used}
              label={<>{statistics.cpu.used.toFixed(1)}%</>}
              filledSegmentColor={statistics.cpu.used >= 90 ? 'red' : undefined}
              mr={'md'}
            />
            <div className={'flex flex-col text-right flex-1'}>
              <Title order={2}>CPU</Title>
              <h2>{statistics.cpu.model}</h2>
              <p className={'text-xs'}>{statistics.cpu.threads} threads</p>
            </div>
          </Card>
          <Card className={'flex !flex-row'}>
            <SemiCircleProgress
              value={(statistics.memory.used / statistics.memory.total) * 100}
              label={<>{((statistics.memory.used / statistics.memory.total) * 100).toFixed(1)}%</>}
              filledSegmentColor={statistics.memory.used / statistics.memory.total >= 0.9 ? 'red' : undefined}
              mr={'md'}
            />
            <div className={'flex flex-col text-right flex-1'}>
              <Title order={2}>Memory</Title>
              <h2>{bytesToString(statistics.memory.used * 1024 * 1024)}</h2>
              <p className={'text-xs'}>{bytesToString(statistics.memory.total * 1024 * 1024)} total</p>
            </div>
          </Card>
          <Card className={'flex !flex-row'}>
            <SemiCircleProgress
              value={(statistics.disk.used / statistics.disk.total) * 100}
              label={<>{((statistics.disk.used / statistics.disk.total) * 100).toFixed(1)}%</>}
              filledSegmentColor={statistics.disk.used / statistics.disk.total >= 0.9 ? 'red' : undefined}
              mr={'md'}
            />
            <div className={'flex flex-col text-right flex-1'}>
              <Title order={2}>Disk</Title>
              <h2>{bytesToString(statistics.disk.used * 1024 * 1024)}</h2>
              <p className={'text-xs'}>{bytesToString(statistics.disk.total * 1024 * 1024)} total</p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
