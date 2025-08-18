import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import NestRow from './NestRow';
import getNests from '@/api/admin/nests/getNests';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import NewButton from '@/elements/button/NewButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import TableNew from '@/elements/table/TableNew';
import NestCreateOrUpdate from './NestCreateOrUpdate';
import NestView from './NestView';

const NestsContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { nests, setNests } = useAdminStore();

  const [loading, setLoading] = useState(nests.data.length === 0);
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
    getNests(page, search)
      .then((data) => {
        setNests(data);
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Nests
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <NewButton onClick={() => navigate('/admin/nests/new')} color={'blue'}>
            <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
            Create
          </NewButton>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <TableNew columns={['ID', 'Name', 'Author', 'Description', 'Eggs']} pagination={nests} onPageSelect={setPage}>
          {nests.data.map((nest) => (
            <NestRow key={nest.uuid} nest={nest} />
          ))}
        </TableNew>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<NestsContainer />} />
      <Route path={'/new'} element={<NestCreateOrUpdate />} />
      <Route path={'/:nestId/*'} element={<NestView />} />
    </Routes>
  );
};
