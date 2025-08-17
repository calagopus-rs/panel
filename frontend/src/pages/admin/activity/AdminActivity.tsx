import getAdminActivity from '@/api/admin/getAdminActivity';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { TableHead, TableHeader, TableBody, NoItems, TableRow, Pagination } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Group, Table as MantineTable, TextInput, Title } from '@mantine/core';

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
        <Table>
          <Pagination data={activities} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'Actor'} />
                  <TableHeader name={'Event'} />
                  <TableHeader name={'IP'} />
                  <TableHeader name={'When'} />
                  <TableHeader />
                </TableHead>

                <TableBody>
                  {activities.data.map((activity) => (
                    <TableRow key={activity.created.toString()}>
                      <MantineTable.Td>
                        {activity.user ? `${activity.user.username} (${activity.isApi ? 'API' : 'Web'})` : 'System'}
                      </MantineTable.Td>

                      <MantineTable.Td>
                        <Code>{activity.event}</Code>
                      </MantineTable.Td>

                      <MantineTable.Td>{activity.ip && <Code>{activity.ip}</Code>}</MantineTable.Td>

                      <MantineTable.Td>
                        <Tooltip content={formatDateTime(activity.created)}>
                          {formatTimestamp(activity.created)}
                        </Tooltip>
                      </MantineTable.Td>

                      <MantineTable.Td>
                        <Group gap={4} justify={'right'} wrap={'nowrap'}>
                          {Object.keys(activity.data).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
                        </Group>
                      </MantineTable.Td>
                    </TableRow>
                  ))}
                </TableBody>
              </table>

              {activities.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </Table>
      )}
    </Container>
  );
};
