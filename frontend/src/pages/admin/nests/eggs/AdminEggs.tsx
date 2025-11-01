import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import EggRow, { eggTableColumns } from './EggRow';
import getEggs from '@/api/admin/nests/eggs/getEggs';
import EggCreateOrUpdate from './EggCreateOrUpdate';
import importEgg from '@/api/admin/nests/eggs/importEgg';
import getNest from '@/api/admin/nests/getNest';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import EggView from '@/pages/admin/nests/eggs/EggView';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

const EggsContainer = ({ nest }: { nest: Nest }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { eggs, setEggs, addEgg } = useAdminStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getEggs(nest.uuid, page, search),
    setStoreData: setEggs,
  });

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => fileInputRef.current?.click()} color={'blue'}>
            <FontAwesomeIcon icon={faUpload} className={'mr-2'} />
            Import
          </Button>
          <Button
            onClick={() => navigate(`/admin/nests/${nest.uuid}/eggs/new`)}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
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
        <Table columns={eggTableColumns} pagination={eggs} onPageSelect={setPage}>
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
      <Route path={'/new'} element={<EggCreateOrUpdate contextNest={nest} />} />
      <Route path={'/:eggId/*'} element={<EggView contextNest={nest} />} />
    </Routes>
  );
};
