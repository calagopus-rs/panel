import { Group, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import getBackupStats, { type BackupStats } from '@/api/admin/stats/getBackupStats.ts';
import getGeneralStats, { type GeneralStats } from '@/api/admin/stats/getGeneralStats.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Card from '@/elements/Card.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Spinner from '@/elements/Spinner.tsx';
import { bytesToString } from '@/lib/size.ts';
import { useToast } from '@/providers/ToastProvider.tsx';

export default function AdminHome() {
  const { addToast } = useToast();

  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [backupStats, setBackupStats] = useState<Record<'allTime' | 'today' | 'week' | 'month', BackupStats> | null>(
    null,
  );

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
    <AdminContentContainer title='Admin'>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Home
        </Title>
      </Group>

      <div>
        <Title order={2} c='white' mb='md'>
          General Statistics
        </Title>

        {!generalStats ? (
          <Spinner.Centered />
        ) : (
          <div className='grid grid-cols-2 xl:grid-cols-5 gap-4'>
            <div className='col-span-2 xl:col-span-1' />

            <Card className='flex'>
              <Title order={3} c='white'>
                {generalStats.users}
              </Title>
              Users
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {generalStats.servers}
              </Title>
              Servers
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {generalStats.locations}
              </Title>
              Locations
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {generalStats.nodes}
              </Title>
              Nodes
            </Card>
          </div>
        )}
      </div>

      <div>
        <Title order={2} c='white' my='md'>
          Backup Statistics
        </Title>

        {!backupStats ? (
          <Spinner.Centered />
        ) : (
          <div className='grid grid-cols-2 xl:grid-cols-5 gap-4'>
            <Title order={3} c='white' className='col-span-2 xl:col-span-1'>
              All Time
            </Title>

            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.allTime.total}
              </Title>
              Total backups all time
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.allTime.successful} ({bytesToString(backupStats.allTime.successfulBytes)})
              </Title>
              Successful backups all time
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.allTime.failed}
              </Title>
              Failed backups all time
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.allTime.deleted} ({bytesToString(backupStats.allTime.deletedBytes)})
              </Title>
              Deleted backups all time
            </Card>

            <Title order={3} c='white' className='col-span-2 xl:col-span-1'>
              Today
            </Title>

            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.today.total}
              </Title>
              Total backups today
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.today.successful} ({bytesToString(backupStats.today.successfulBytes)})
              </Title>
              Successful backups today
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.today.failed}
              </Title>
              Failed backups today
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.today.deleted} ({bytesToString(backupStats.today.deletedBytes)})
              </Title>
              Deleted backups today
            </Card>

            <Title order={3} c='white' className='col-span-2 xl:col-span-1'>
              This Week
            </Title>

            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.week.total}
              </Title>
              Total backups this week
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.week.successful} ({bytesToString(backupStats.week.successfulBytes)})
              </Title>
              Successful backups this week
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.week.failed}
              </Title>
              Failed backups this week
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.week.deleted} ({bytesToString(backupStats.week.deletedBytes)})
              </Title>
              Deleted backups this week
            </Card>

            <Title order={3} c='white' className='col-span-2 xl:col-span-1'>
              This Month
            </Title>

            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.month.total}
              </Title>
              Total backups this month
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.month.successful} ({bytesToString(backupStats.month.successfulBytes)})
              </Title>
              Successful backups this month
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.month.failed}
              </Title>
              Failed backups this month
            </Card>
            <Card className='flex'>
              <Title order={3} c='white'>
                {backupStats.month.deleted} ({bytesToString(backupStats.month.deletedBytes)})
              </Title>
              Deleted backups this month
            </Card>
          </div>
        )}
      </div>
    </AdminContentContainer>
  );
}
