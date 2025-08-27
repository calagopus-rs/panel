import getSchedules from '@/api/server/schedules/getSchedules';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import ScheduleRow from './ScheduleRow';
import { useSearchParams } from 'react-router';
import { load } from '@/lib/debounce';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import ScheduleCreateModal from './modals/ScheduleCreateModal';
import { ContextMenuProvider } from '@/elements/ContextMenu';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { server, schedules, setSchedules } = useServerStore();

  const [loading, setLoading] = useState(schedules.data.length === 0);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState<'create'>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getSchedules(server.uuid, page, search).then((data) => {
      setSchedules(data);
      load(false, setLoading);
    });
  }, [page, search]);

  return (
    <>
      <ScheduleCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Schedules
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table
            columns={['Name', 'Last Run', 'Last Failure', 'Status', '']}
            pagination={schedules}
            onPageSelect={setPage}
          >
            {schedules.data.map((schedule) => (
              <ScheduleRow key={schedule.uuid} schedule={schedule} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
