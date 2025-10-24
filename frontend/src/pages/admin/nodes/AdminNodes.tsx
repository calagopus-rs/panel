import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import NodeRow, { nodeTableColumns } from './NodeRow';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import TextInput from '@/elements/input/TextInput';
import NodeView from './NodeView';
import getNodes from '@/api/admin/nodes/getNodes';
import NodeCreateOrUpdate from './NodeCreateOrUpdate';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

const NodesContainer = () => {
  const navigate = useNavigate();
  const { nodes, setNodes } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getNodes,
    setStoreData: setNodes,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Nodes
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/nodes/new')}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={nodeTableColumns} pagination={nodes} onPageSelect={setPage}>
          {nodes.data.map((node) => (
            <NodeRow key={node.uuid} node={node} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<NodesContainer />} />
      <Route path={'/new'} element={<NodeCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<NodeView />} />
    </Routes>
  );
};
