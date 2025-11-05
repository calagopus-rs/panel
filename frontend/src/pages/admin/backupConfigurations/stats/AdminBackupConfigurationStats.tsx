import { useEffect, useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import getBackupConfigurationStats, {
  BackupStats,
} from '@/api/admin/backup-configurations/getBackupConfigurationStats';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import Card from '@/elements/Card';

export default ({ backupConfiguration }: { backupConfiguration?: BackupConfiguration }) => {
  const { addToast } = useToast();

  const [stats, setStats] = useState<Record<'today' | 'week' | 'month', BackupStats> | null>(null);

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
      <Title order={2} mb={'md'}>
        Backup Configuration Stats
      </Title>

      {!stats ? (
        <Spinner.Centered />
      ) : (
        <div className={'grid grid-cols-2 xl:grid-cols-5 gap-4'}>
          <Title order={3} c={'white'} className={'col-span-2 xl:col-span-1'}>
            Today
          </Title>

          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.today.total}
            </Title>
            Total backups today
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.today.successful}
            </Title>
            Successful backups today
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.today.failed}
            </Title>
            Failed backups today
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.today.deleted}
            </Title>
            Deleted backups today
          </Card>

          <Title order={3} c={'white'} className={'col-span-2 xl:col-span-1'}>
            This Week
          </Title>

          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.week.total}
            </Title>
            Total backups this week
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.week.successful}
            </Title>
            Successful backups this week
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.week.failed}
            </Title>
            Failed backups this week
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.week.deleted}
            </Title>
            Deleted backups this week
          </Card>

          <Title order={3} c={'white'} className={'col-span-2 xl:col-span-1'}>
            This Month
          </Title>

          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.month.total}
            </Title>
            Total backups this month
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.month.successful}
            </Title>
            Successful backups this month
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.month.failed}
            </Title>
            Failed backups this month
          </Card>
          <Card className={'flex'}>
            <Title order={3} c={'white'}>
              {stats.month.deleted}
            </Title>
            Deleted backups this month
          </Card>
        </div>
      )}
    </>
  );
};
