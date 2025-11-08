import getSchedules from '@/api/server/schedules/getSchedules';
import { useServerStore } from '@/stores/server';
import { useRef, useState } from 'react';
import ScheduleRow from './ScheduleRow';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import ScheduleCreateModal from './modals/ScheduleCreateModal';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import importSchedule from '@/api/server/schedules/importSchedule';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import jsYaml from 'js-yaml';

export default () => {
  const { addToast } = useToast();
  const { server, schedules, setSchedules, addSchedule } = useServerStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getSchedules(server.uuid, page, search),
    setStoreData: setSchedules,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = null;

    try {
      const text = await file.text().then((t) => t.trim());
      let data: object;
      try {
        if (text.startsWith('{')) {
          data = JSON.parse(text);
        } else {
          data = jsYaml.load(text) as object;
        }
      } catch (err) {
        addToast(`Failed to parse schedule: ${err}`, 'error');
        return;
      }

      importSchedule(server.uuid, data)
        .then((data) => {
          addSchedule(data);
          addToast('Schedule imported.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } catch (err) {
      addToast(httpErrorToHuman(err), 'error');
    }
  };

  return (
    <>
      <ScheduleCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Schedules
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => fileInputRef.current?.click()} color={'blue'}>
            <FontAwesomeIcon icon={faUpload} className={'mr-2'} />
            Import
          </Button>
          <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>

          <input
            type={'file'}
            accept={'.json,.yml,.yaml'}
            ref={fileInputRef}
            className={'hidden'}
            onChange={handleFileUpload}
          />
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table
            columns={['Name', 'Last Run', 'Last Failure', 'Status', 'Created', '']}
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
