import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getNodes from '@/api/admin/nodes/getNodes';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { nodeTableColumns } from '@/lib/tableColumns';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import NodeCreateOrUpdate from './NodeCreateOrUpdate';
import NodeRow from './NodeRow';
import NodeView from './NodeView';

function NodesContainer() {
  const navigate = useNavigate();
  const { nodes, setNodes } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getNodes,
    setStoreData: setNodes,
  });

  return (
    <>
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
    </>
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
