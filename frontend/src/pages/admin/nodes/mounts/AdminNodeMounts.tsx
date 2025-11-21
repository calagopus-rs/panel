import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getNodeMounts from '@/api/admin/nodes/mounts/getNodeMounts';
import Button from '@/elements/Button';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import NodeMountAddModal from './modals/NodeMountAddModal';
import NodeMountRow, { nodeMountTableColumns } from './NodeMountRow';

export default function AdminNodeMounts({ node }: { node: Node }) {
  const { nodeMounts, setNodeMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getNodeMounts(node.uuid, page, search),
    setStoreData: setNodeMounts,
  });

  return (
    <>
      <NodeMountAddModal node={node} opened={openModal === 'add'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>Node Mounts</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('add')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table columns={nodeMountTableColumns} loading={loading} pagination={nodeMounts} onPageSelect={setPage}>
          {nodeMounts.data.map((mount) => (
            <NodeMountRow key={mount.mount.uuid} node={node} mount={mount} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
