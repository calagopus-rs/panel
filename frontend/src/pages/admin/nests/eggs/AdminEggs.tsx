import { faPlus, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import jsYaml from 'js-yaml';
import { ChangeEvent, useRef } from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import getEggs from '@/api/admin/nests/eggs/getEggs.ts';
import importEgg from '@/api/admin/nests/eggs/importEgg.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { eggTableColumns } from '@/lib/tableColumns.ts';
import EggView from '@/pages/admin/nests/eggs/EggView.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';
import EggCreateOrUpdate from './EggCreateOrUpdate.tsx';
import EggRow from './EggRow.tsx';

function EggsContainer({ contextNest }: { contextNest: AdminNest }) {
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

    event.target.value = '';

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
  };

  return (
    <AdminContentContainer
      title='Eggs'
      titleOrder={2}
      search={search}
      setSearch={setSearch}
      contentRight={
        <>
          <Button onClick={() => fileInputRef.current?.click()} color='blue'>
            <FontAwesomeIcon icon={faUpload} className='mr-2' />
            Import
          </Button>
          <Button
            onClick={() => navigate(`/admin/nests/${contextNest.uuid}/eggs/new`)}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>

          <input
            type='file'
            accept='.json,.yml,.yaml'
            ref={fileInputRef}
            className='hidden'
            onChange={handleFileUpload}
          />
        </>
      }
    >
      <Table columns={eggTableColumns} loading={loading} pagination={eggs} onPageSelect={setPage}>
        {eggs.data.map((egg) => (
          <EggRow key={egg.uuid} nest={contextNest} egg={egg} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}

export default function AdminEggs({ contextNest }: { contextNest: AdminNest }) {
  return (
    <Routes>
      <Route path='/' element={<EggsContainer contextNest={contextNest} />} />
      <Route path='/new' element={<EggCreateOrUpdate contextNest={contextNest} />} />
      <Route path='/:eggId/*' element={<EggView contextNest={contextNest} />} />
    </Routes>
  );
}
