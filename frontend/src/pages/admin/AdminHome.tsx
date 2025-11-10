import { Group, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import getBackupStats, { BackupStats } from '@/api/admin/stats/getBackupStats';
import getGeneralStats, { GeneralStats } from '@/api/admin/stats/getGeneralStats';
import { httpErrorToHuman } from '@/api/axios';
import Card from '@/elements/Card';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';

export default function AdminHome() {
  const { addToast } = useToast();

  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [backupStats, setBackupStats] = useState<Record<'today' | 'week' | 'month', BackupStats> | null>(null);

  useEffect(() => {
    getGeneralStats()
      .then((data) => {
        setGeneralStats(data);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, []);

  useEffect(() => {
    getBackupStats()
      .then((data) => {
        setBackupStats(data);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, []);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Home
        </Title>
      </Group>

      <div>
        <Title order={2} c={'white'} mb={'md'}>
          General Statistics
        </Title>

        {!generalStats ? (
          <Spinner.Centered />
        ) : (
          <div className={'grid grid-cols-2 xl:grid-cols-5 gap-4'}>
            <div className={'col-span-2 xl:col-span-1'} />

            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {generalStats.users}
              </Title>
              Users
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {generalStats.servers}
              </Title>
              Servers
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {generalStats.locations}
              </Title>
              Locations
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {generalStats.nodes}
              </Title>
              Nodes
            </Card>
          </div>
        )}
      </div>

      <div>
        <Title order={2} c={'white'} my={'md'}>
          Backup Statistics
        </Title>

        {!backupStats ? (
          <Spinner.Centered />
        ) : (
          <div className={'grid grid-cols-2 xl:grid-cols-5 gap-4'}>
            <Title order={3} c={'white'} className={'col-span-2 xl:col-span-1'}>
              Today
            </Title>

            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.today.total}
              </Title>
              Total backups today
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.today.successful}
              </Title>
              Successful backups today
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.today.failed}
              </Title>
              Failed backups today
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.today.deleted}
              </Title>
              Deleted backups today
            </Card>

            <Title order={3} c={'white'} className={'col-span-2 xl:col-span-1'}>
              This Week
            </Title>

            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.week.total}
              </Title>
              Total backups this week
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.week.successful}
              </Title>
              Successful backups this week
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.week.failed}
              </Title>
              Failed backups this week
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.week.deleted}
              </Title>
              Deleted backups this week
            </Card>

            <Title order={3} c={'white'} className={'col-span-2 xl:col-span-1'}>
              This Month
            </Title>

            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.month.total}
              </Title>
              Total backups this month
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.month.successful}
              </Title>
              Successful backups this month
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.month.failed}
              </Title>
              Failed backups this month
            </Card>
            <Card className={'flex'}>
              <Title order={3} c={'white'}>
                {backupStats.month.deleted}
              </Title>
              Deleted backups this month
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
