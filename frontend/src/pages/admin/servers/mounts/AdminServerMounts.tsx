import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import getServerMounts from '@/api/admin/servers/mounts/getServerMounts.ts';
import Button from '@/elements/Button.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { serverMountTableColumns } from '@/lib/tableColumns.ts';
import ServerMountAddModal from '@/pages/admin/servers/mounts/modals/ServerMountAddModal.tsx';
import ServerMountRow from '@/pages/admin/servers/mounts/ServerMountRow.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';

export default function AdminServerMounts({ server }: { server: AdminServer }) {
  const { serverMounts, setServerMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getServerMounts(server.uuid, page, search),
    setStoreData: setServerMounts,
  });

  return (
    <AdminContentContainer
      title='Server Mounts'
      titleOrder={2}
      search={search}
      setSearch={setSearch}
      contentRight={
        <Button onClick={() => setOpenModal('add')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
          Add
        </Button>
      }
    >
      <ServerMountAddModal server={server} opened={openModal === 'add'} onClose={() => setOpenModal(null)} />

      <ContextMenuProvider>
        <Table columns={serverMountTableColumns} loading={loading} pagination={serverMounts} onPageSelect={setPage}>
          {serverMounts.data.map((mount) => (
            <ServerMountRow key={mount.mount.uuid} server={server} mount={mount} />
          ))}
        </Table>
      </ContextMenuProvider>
    </AdminContentContainer>
  );
}
