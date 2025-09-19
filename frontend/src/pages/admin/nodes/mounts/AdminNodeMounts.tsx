import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import { useAdminStore } from '@/stores/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import NodeMountRow from './NodeMountRow';
import getNodeMounts from '@/api/admin/nodes/mounts/getNodeMounts';
import NodeMountCreateModal from './modals/NodeMountCreateModal';

export default ({ node }: { node: Node }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { nodeMounts, setNodeMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'create'>(null);
  const [loading, setLoading] = useState(nodeMounts.data.length === 0);
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
    getNodeMounts(node.uuid, page, search)
      .then((data) => {
        setNodeMounts(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <NodeMountCreateModal node={node} opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} mb={'md'}>
        <Title order={2}>
          Node Mounts
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
            columns={['Id', 'Name', 'Source', 'Target', 'Added', '']}
            pagination={nodeMounts}
            onPageSelect={setPage}
          >
            {nodeMounts.data.map((mount) => (
              <NodeMountRow key={mount.mount.uuid} node={node} mount={mount} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
