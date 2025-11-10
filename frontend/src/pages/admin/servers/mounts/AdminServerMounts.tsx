import { useState } from 'react';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { useAdminStore } from '@/stores/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import ServerMountRow, { serverMountTableColumns } from '@/pages/admin/servers/mounts/ServerMountRow';
import getServerMounts from '@/api/admin/servers/mounts/getServerMounts';
import ServerMountAddModal from '@/pages/admin/servers/mounts/modals/ServerMountAddModal';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ server }: { server: AdminServer }) => {
  const { serverMounts, setServerMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page) => getServerMounts(server.uuid, page),
    setStoreData: setServerMounts,
  });

  return (
    <>
      <ServerMountAddModal server={server} opened={openModal === 'add'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} align={'start'} mb={'md'}>
        <Title order={2}>Server Mounts</Title>
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
          <Table columns={serverMountTableColumns} pagination={serverMounts} onPageSelect={setPage}>
            {serverMounts.data.map((mount) => (
              <ServerMountRow key={mount.mount.uuid} server={server} mount={mount} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
