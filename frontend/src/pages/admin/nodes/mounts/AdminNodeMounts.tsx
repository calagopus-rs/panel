import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getNodeMounts from '@/api/admin/nodes/mounts/getNodeMounts.ts';
import Button from '@/elements/Button.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { nodeMountTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import NodeMountAddModal from './modals/NodeMountAddModal.tsx';
import NodeMountRow from './NodeMountRow.tsx';

export default function AdminNodeMounts({ node }: { node: Node }) {
  const { nodeMounts, setNodeMounts } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getNodeMounts(node.uuid, page, search),
    setStoreData: setNodeMounts,
  });

  return (
    <AdminContentContainer title='Node Mounts'>
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
    </AdminContentContainer>
  );
}
