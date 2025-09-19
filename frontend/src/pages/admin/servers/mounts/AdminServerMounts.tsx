import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import { useAdminStore } from '@/stores/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import ServerMountRow from "@/pages/admin/servers/mounts/ServerMountRow";
import getServerMounts from "@/api/admin/servers/mounts/getServerMounts";

export default ({ server }: { server: AdminServer }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { serverMounts, setServerMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'create'>(null);
  const [loading, setLoading] = useState(serverMounts.data.length === 0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString() });
  }, [page]);

  useEffect(() => {
    getServerMounts(server.uuid, page)
      .then((data) => {
        setServerMounts(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page]);

  return (
    <>
      {/*<NodeMountCreateModal node={node} opened={openModal === 'create'} onClose={() => setOpenModal(null)} />*/}

      <Group justify={'space-between'} mb={'md'}>
        <Title order={2}>
          Node Mounts
        </Title>
        <Group>
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
            columns={['Id', 'Name', 'Source', 'Target', 'Added', '']}
            pagination={serverMounts}
            onPageSelect={setPage}
          >
            {serverMounts.data.map((mount) => (
              <ServerMountRow key={mount.uuid} server={server} mount={mount} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
