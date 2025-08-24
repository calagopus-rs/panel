import getUserActivity from '@/api/me/getUserActivity';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Spinner from '@/elements/Spinner';
import Table, { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { load } from '@/lib/debounce';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { Group, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<ResponseMeta<UserActivity>>();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getUserActivity(page, search).then((data) => {
      setActivities(data);
      load(false, setLoading);
    });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Activity
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={['Actor', 'Event', 'IP', 'When', '']} pagination={activities} onPageSelect={setPage}>
          {activities.data.map((activity) => (
            <TableRow key={activity.created.toString()}>
              <TableData>{activity.isApi ? 'API' : 'Web'}</TableData>

              <TableData>
                <Code>{activity.event}</Code>
              </TableData>

              <TableData>
                <Code>{activity.ip}</Code>
              </TableData>

              <TableData>
                <Tooltip content={formatDateTime(activity.created)}>{formatTimestamp(activity.created)}</Tooltip>
              </TableData>

              <TableData>
                <Group gap={4} justify={'right'} wrap={'nowrap'}>
                  {Object.keys(activity.data).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
                </Group>
              </TableData>
            </TableRow>
          ))}
        </Table>
      )}
    </>
  );
};
