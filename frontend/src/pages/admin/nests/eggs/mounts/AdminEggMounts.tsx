import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getEggMounts from '@/api/admin/nests/eggs/mounts/getEggMounts.ts';
import Button from '@/elements/Button.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import EggMountRow from './EggMountRow.tsx';
import EggMountAddModal from './modals/EggMountAddModal.tsx';

export default function AdminEggMounts({
  contextNest,
  contextEgg,
}: {
  contextNest: AdminNest;
  contextEgg: AdminNestEgg;
}) {
  const { eggMounts, setEggMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getEggMounts(contextNest.uuid, contextEgg.uuid, page, search),
    setStoreData: setEggMounts,
  });

  return (
    <AdminContentContainer title='Egg Mounts'>
      <EggMountAddModal
        nest={contextNest}
        egg={contextEgg}
        opened={openModal === 'add'}
        onClose={() => setOpenModal(null)}
      />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>Egg Mounts</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('add')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={['ID', 'Name', 'Source', 'Target', 'Added', '']}
          loading={loading}
          pagination={eggMounts}
          onPageSelect={setPage}
        >
          {eggMounts.data.map((mount) => (
            <EggMountRow key={mount.mount.uuid} nest={contextNest} egg={contextEgg} mount={mount} />
          ))}
        </Table>
      </ContextMenuProvider>
    </AdminContentContainer>
  );
}
