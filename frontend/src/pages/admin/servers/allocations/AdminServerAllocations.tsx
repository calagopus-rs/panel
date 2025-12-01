import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getServerAllocations from '@/api/admin/servers/allocations/getServerAllocations';
import Button from '@/elements/Button';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import Table from '@/elements/Table';
import ServerAllocationAddModal from '@/pages/admin/servers/allocations/modals/ServerAllocationAddModal';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import ServerAllocationRow, { serverAllocationTableColumns } from './ServerAllocationRow';
import TextInput from '@/elements/input/TextInput';

export default function AdminServerAllocations({ server }: { server: AdminServer }) {
  const { serverAllocations, setServerAllocations } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getServerAllocations(server.uuid, page, search),
    setStoreData: setServerAllocations,
  });

  return (
    <>
      <ServerAllocationAddModal server={server} opened={openModal === 'add'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>Server Allocations</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('add')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={serverAllocationTableColumns}
          loading={loading}
          pagination={serverAllocations}
          onPageSelect={setPage}
        >
          {serverAllocations.data.map((allocation) => (
            <ServerAllocationRow key={allocation.uuid} server={server} allocation={allocation} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
