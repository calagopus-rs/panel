import { Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import getBackupConfigurationStats, {
  type BackupStats,
} from '@/api/admin/backup-configurations/getBackupConfigurationStats.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Card from '@/elements/Card.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { bytesToString } from '@/lib/size.ts';

export default function AdminBackupConfigurationStats({
  backupConfiguration,
}: {
  backupConfiguration: BackupConfiguration;
}) {
  const { addToast } = useToast();

  const [stats, setStats] = useState<Record<'allTime' | 'today' | 'week' | 'month', BackupStats> | null>(null);

  useEffect(() => {
    getBackupConfigurationStats(backupConfiguration.uuid)
      .then((data) => {
        setStats(data);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, []);

  return (
    <>
      <Title order={2} mb='md'>
        Backup Configuration Stats
      </Title>

      {!stats ? (
        <Spinner.Centered />
      ) : (
        <div className='grid grid-cols-2 xl:grid-cols-5 gap-4'>
          <Title order={3} c='white' className='col-span-2 xl:col-span-1'>
            All Time
          </Title>

          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.allTime.total}
            </Title>
            Total backups all time
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.allTime.successful} ({bytesToString(stats.allTime.successfulBytes)})
            </Title>
            Successful backups all time
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.allTime.failed}
            </Title>
            Failed backups all time
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.allTime.deleted} ({bytesToString(stats.allTime.deletedBytes)})
            </Title>
            Deleted backups all time
          </Card>

          <Title order={3} c='white' className='col-span-2 xl:col-span-1'>
            Today
          </Title>

          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.today.total}
            </Title>
            Total backups today
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.today.successful} ({bytesToString(stats.today.successfulBytes)})
            </Title>
            Successful backups today
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.today.failed}
            </Title>
            Failed backups today
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.today.deleted} ({bytesToString(stats.today.deletedBytes)})
            </Title>
            Deleted backups today
          </Card>

          <Title order={3} c='white' className='col-span-2 xl:col-span-1'>
            This Week
          </Title>

          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.week.total}
            </Title>
            Total backups this week
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.week.successful} ({bytesToString(stats.week.successfulBytes)})
            </Title>
            Successful backups this week
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.week.failed}
            </Title>
            Failed backups this week
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.week.deleted} ({bytesToString(stats.week.deletedBytes)})
            </Title>
            Deleted backups this week
          </Card>

          <Title order={3} c='white' className='col-span-2 xl:col-span-1'>
            This Month
          </Title>

          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.month.total}
            </Title>
            Total backups this month
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.month.successful} ({bytesToString(stats.month.successfulBytes)})
            </Title>
            Successful backups this month
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.month.failed}
            </Title>
            Failed backups this month
          </Card>
          <Card className='flex'>
            <Title order={3} c='white'>
              {stats.month.deleted} ({bytesToString(stats.month.deletedBytes)})
            </Title>
            Deleted backups this month
          </Card>
        </div>
      )}
    </>
  );
}
