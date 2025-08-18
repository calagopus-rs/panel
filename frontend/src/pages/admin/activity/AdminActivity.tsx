import getAdminActivity from '@/api/admin/getAdminActivity';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Group, TextInput, Title } from '@mantine/core';
import TableNew from '@/elements/table/TableNew';
import ActivityRow from './ActivityRow';

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
            <ActivityRow key={activity.created.toString()} activity={activity} />
          ))}
        </TableNew>
      )}
    </Container>
  );
};
