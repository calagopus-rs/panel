import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useRef, ChangeEvent } from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import EggRow, { eggTableColumns } from './EggRow';
import getEggs from '@/api/admin/nests/eggs/getEggs';
import EggCreateOrUpdate from './EggCreateOrUpdate';
import importEgg from '@/api/admin/nests/eggs/importEgg';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import EggView from '@/pages/admin/nests/eggs/EggView';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import jsYaml from 'js-yaml';

const EggsContainer = ({ contextNest }: { contextNest: AdminNest }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { eggs, setEggs, addEgg } = useAdminStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getEggs(contextNest.uuid, page, search),
    setStoreData: setEggs,
  });

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = null;

    try {
      const text = await file.text().then((t) => t.trim());
      let data: object;
      try {
        if (text.startsWith('{')) {
          data = JSON.parse(text);
        } else {
          data = jsYaml.load(text) as object;
        }
      } catch (err) {
        addToast(`Failed to parse egg: ${err}`, 'error');
        return;
      }

      importEgg(contextNest.uuid, data)
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
            onClick={() => navigate(`/admin/nests/${contextNest.uuid}/eggs/new`)}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>

          <input
            type={'file'}
            accept={'.json,.yml,.yaml'}
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
            <EggRow key={egg.uuid} nest={contextNest} egg={egg} />
          ))}
        </Table>
      )}
    </>
  );
};

export default ({ contextNest }: { contextNest?: AdminNest }) => {
  return (
    <Routes>
      <Route path={'/'} element={<EggsContainer contextNest={contextNest} />} />
      <Route path={'/new'} element={<EggCreateOrUpdate contextNest={contextNest} />} />
      <Route path={'/:eggId/*'} element={<EggView contextNest={contextNest} />} />
    </Routes>
  );
};
