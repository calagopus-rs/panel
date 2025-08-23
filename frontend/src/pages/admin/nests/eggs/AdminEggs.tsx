import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect, useRef } from 'react';
import { Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import EggRow from './EggRow';
import getEggs from '@/api/admin/eggs/getEggs';
import EggCreateOrUpdate from './EggCreateOrUpdate';
import importEgg from '@/api/admin/eggs/importEgg';
import getNest from '@/api/admin/nests/getNest';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';

const EggsContainer = ({ nest }: { nest: Nest }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { eggs, setEggs, addEgg } = useAdminStore();

  const [loading, setLoading] = useState(eggs.data.length === 0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getEggs(nest.uuid, page, search)
      .then((data) => {
        setEggs(data);
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      importEgg(nest.uuid, jsonData)
        .then((data) => {
          addEgg(data);
          addToast('Egg imported.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } catch (err) {
      addToast(httpErrorToHuman(err), 'error');
    }
  };

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={2} c={'white'}>
          Eggs
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <Button onClick={() => fileInputRef.current?.click()} color={'blue'}>
            <FontAwesomeIcon icon={faUpload} className={'mr-2'} />
            Upload
          </Button>
          <Button onClick={() => navigate(`/admin/nests/${nest.uuid}/eggs/new`)} color={'blue'}>
            <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
            Create
          </Button>

          <input
            type={'file'}
            accept={'application/json'}
            ref={fileInputRef}
            className={'hidden'}
            onChange={handleFileUpload}
          />
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={['ID', 'Name', 'Author', 'Description', 'Servers']} pagination={eggs} onPageSelect={setPage}>
          {eggs.data.map((egg) => (
            <EggRow key={egg.uuid} nest={nest} egg={egg} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  const params = useParams<'nestId'>();
  const { addToast } = useToast();
  const [nest, setNest] = useState<Nest | null>(null);

  useEffect(() => {
    if (params.nestId) {
      getNest(params.nestId)
        .then((nest) => {
          setNest(nest);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.nestId]);

  return !nest ? (
    <Spinner.Centered />
  ) : (
    <Routes>
      <Route path={'/'} element={<EggsContainer nest={nest} />} />
      <Route path={'/new'} element={<EggCreateOrUpdate nest={nest} />} />
      <Route path={'/:eggId'} element={<EggCreateOrUpdate nest={nest} />} />
    </Routes>
  );
};
