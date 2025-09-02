import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import NodeRow from './NodeRow';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import TextInput from '@/elements/input/TextInput';
import { load } from '@/lib/debounce';
import NodeView from './NodeView';
import getNodes from '@/api/admin/nodes/getNodes';
import NodeCreateOrUpdate from './NodeCreateOrUpdate';

const NodesContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { nodes, setNodes } = useAdminStore();

  const [loading, setLoading] = useState(nodes.data.length === 0);
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
    getNodes(page, search)
      .then((data) => {
        setNodes(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Nodes
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
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
        <Table
          columns={['', 'Id', 'Name', 'Location', 'URL', 'Servers', 'Created']}
          pagination={nodes}
          onPageSelect={setPage}
        >
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
