import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import jsYaml from 'js-yaml';
import { ChangeEvent, useRef, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import getSchedules from '@/api/server/schedules/getSchedules.ts';
import importSchedule from '@/api/server/schedules/importSchedule.ts';
import Button from '@/elements/Button.tsx';
import ConditionalTooltip from '@/elements/ConditionalTooltip.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import ScheduleCreateOrUpdateModal from './modals/ScheduleCreateOrUpdateModal.tsx';
import ScheduleRow from './ScheduleRow.tsx';

export default function ServerSchedules() {
  const { addToast } = useToast();
  const { server, schedules, setSchedules, addSchedule } = useServerStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getSchedules(server.uuid, page, search),
    setStoreData: setSchedules,
  });

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

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
  };

  return (
    <ServerContentContainer
      title='Schedules'
      subtitle={`${schedules.total} of ${server.featureLimits.schedules} maximum schedules created.`}
      search={search}
      setSearch={setSearch}
      contentRight={
        <>
          <Button onClick={() => fileInputRef.current?.click()} color='blue'>
            <FontAwesomeIcon icon={faUpload} className='mr-2' />
            Import
          </Button>
          <ConditionalTooltip
            enabled={schedules.total >= server.featureLimits.schedules}
            label={`This server is limited to ${server.featureLimits.schedules} schedules.`}
          >
            <Button
              disabled={schedules.total >= server.featureLimits.schedules}
              onClick={() => setOpenModal('create')}
              color='blue'
              leftSection={<FontAwesomeIcon icon={faPlus} />}
            >
              Create
            </Button>
          </ConditionalTooltip>

          <input
            type='file'
            accept='.json,.yml,.yaml'
            ref={fileInputRef}
            className='hidden'
            onChange={handleFileUpload}
          />
        </>
      }
    >
      <ScheduleCreateOrUpdateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <ContextMenuProvider>
        <Table
          columns={['Name', 'Last Run', 'Last Failure', 'Status', 'Created', '']}
          loading={loading}
          pagination={schedules}
          onPageSelect={setPage}
        >
          {schedules.data.map((schedule) => (
            <ScheduleRow key={schedule.uuid} schedule={schedule} />
          ))}
        </Table>
      </ContextMenuProvider>
    </ServerContentContainer>
  );
}
