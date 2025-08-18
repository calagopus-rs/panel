import getAdminActivity from '@/api/admin/getAdminActivity';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Group, TextInput, Title } from '@mantine/core';
import TableNew, { TableData, TableRow } from '@/elements/table/TableNew';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<ResponseMeta<AdminActivity>>();

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
    getAdminActivity(page, search).then((data) => {
      setActivities(data);
      setLoading(false);
    });
  }, [page, search]);

  return (
    <Container>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Activity
        </Title>
        <TextInput
          placeholder={'Search activities...'}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={250}
        />
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <TableNew columns={['Actor', 'Event', 'IP', 'When', '']} pagination={activities} onPageSelect={setPage}>
          {activities.data.map((activity) => (
            <TableRow key={activity.created.toString()}>
              <TableData>
                {activity.user ? `${activity.user.username} (${activity.isApi ? 'API' : 'Web'})` : 'System'}
              </TableData>

              <TableData>
                <Code>{activity.event}</Code>
              </TableData>

              <TableData>{activity.ip && <Code>{activity.ip}</Code>}</TableData>

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
        </TableNew>
      )}
    </Container>
  );
};
