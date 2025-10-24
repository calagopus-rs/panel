import { useState } from 'react';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { useAdminStore } from '@/stores/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import getServerAllocations from '@/api/admin/servers/allocations/getServerAllocations';
import ServerAllocationRow, { serverAllocationTableColumns } from './ServerAllocationRow';
import ServerAllocationAddModal from '@/pages/admin/servers/allocations/modals/ServerAllocationAddModal';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ server }: { server: AdminServer }) => {
  const { serverAllocations, setServerAllocations } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page) => getServerAllocations(server.uuid, page),
    setStoreData: setServerAllocations,
  });

  return (
    <>
      <ServerAllocationAddModal server={server} opened={openModal === 'add'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={2}>Server Allocations</Title>
        <Group>
          <Button onClick={() => setOpenModal('add')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table columns={serverAllocationTableColumns} pagination={serverAllocations} onPageSelect={setPage}>
            {serverAllocations.data.map((allocation) => (
              <ServerAllocationRow key={allocation.uuid} server={server} allocation={allocation} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
