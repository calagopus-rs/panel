import { httpErrorToHuman } from '@/api/axios';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useAdminStore } from '@/stores/admin';
import getNodes from '@/api/admin/nodes/getNodes';
import NodeRow from './NodeRow';
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
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Nodes</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => navigate('/admin/nodes/new')}>New Node</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={nodes} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'ID'} />
                  <TableHeader name={'Name'} />
                  <TableHeader name={'Location'} />
                  <TableHeader name={'Visibility'} />
                  <TableHeader name={'Servers'} />
                  <TableHeader name={'Memory'} />
                  <TableHeader name={'Disk'} />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {nodes.data.map((node) => (
                      <NodeRow key={node.id} node={node} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : nodes.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </>
  );
};

export default () => {
  return (
    <Container>
      <Routes>
        <Route path={'/'} element={<NodesContainer />} />
        <Route path={'/new'} element={<NodeCreateOrUpdate />} />
        <Route path={'/:id'} element={<NodeCreateOrUpdate />} />
      </Routes>
    </Container>
  );
};
