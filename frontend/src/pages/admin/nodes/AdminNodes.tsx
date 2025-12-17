import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getNodes from '@/api/admin/nodes/getNodes.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { nodeTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import NodeCreateOrUpdate from './NodeCreateOrUpdate.tsx';
import NodeRow from './NodeRow.tsx';
import NodeView from './NodeView.tsx';

function NodesContainer() {
  const navigate = useNavigate();
  const { nodes, setNodes } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getNodes,
    setStoreData: setNodes,
  });

  return (
    <AdminContentContainer title='Nodes'>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Nodes
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/nodes/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={nodeTableColumns} loading={loading} pagination={nodes} onPageSelect={setPage}>
        {nodes.data.map((node) => (
          <NodeRow key={node.uuid} node={node} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}

export default function AdminNodes() {
  return (
    <Routes>
      <Route path='/' element={<NodesContainer />} />
      <Route path='/new' element={<NodeCreateOrUpdate />} />
      <Route path='/:id/*' element={<NodeView />} />
    </Routes>
  );
}
