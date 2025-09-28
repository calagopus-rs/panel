import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import MountCreateOrUpdate from './MountCreateOrUpdate';
import MountRow from './MountRow';
import { Group, TextInput, Title } from '@mantine/core';
import Table from '@/elements/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import getMounts from '@/api/admin/mounts/getMounts';

const MountsContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { mounts, setMounts } = useAdminStore();

  const [loading, setLoading] = useState(mounts.data.length === 0);
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
    getMounts(page, search)
      .then((data) => {
        setMounts(data);
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
          Mounts
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/mounts/new')}
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
          columns={['ID', 'Name', 'Source', 'Target', 'Servers', 'Nodes']}
          pagination={mounts}
          onPageSelect={setPage}
        >
          {mounts.data.map((m) => (
            <MountRow key={m.uuid} mount={m} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<MountsContainer />} />
      <Route path={'/new'} element={<MountCreateOrUpdate />} />
      <Route path={'/:id'} element={<MountCreateOrUpdate />} />
    </Routes>
  );
};
