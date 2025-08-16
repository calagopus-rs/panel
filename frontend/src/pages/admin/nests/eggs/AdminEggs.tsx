import { httpErrorToHuman } from '@/api/axios';
import { Button } from '@/elements/button';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect, useRef } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useAdminStore } from '@/stores/admin';
import EggRow from './EggRow';
import getEggs from '@/api/admin/eggs/getEggs';
import EggCreateOrUpdate from './EggCreateOrUpdate';
import importEgg from '@/api/admin/eggs/importEgg';

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
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Eggs</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => fileInputRef.current?.click()}>Upload</Button>
          <Button onClick={() => navigate(`/admin/nests/${nest.uuid}/eggs/new`)}>New Egg</Button>

          <input
            type={'file'}
            accept={'application/json'}
            ref={fileInputRef}
            className={'hidden'}
            onChange={handleFileUpload}
          />
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={eggs} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'ID'} />
                  <TableHeader name={'Name'} />
                  <TableHeader name={'Author'} />
                  <TableHeader name={'Description'} />
                  <TableHeader name={'Servers'} />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {eggs.data.map((egg) => (
                      <EggRow key={egg.uuid} nest={nest} egg={egg} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : eggs.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </>
  );
};

export default ({ nest }: { nest: Nest }) => {
  return (
    <Routes>
      <Route path={'/'} element={<EggsContainer nest={nest} />} />
      <Route path={'/new'} element={<EggCreateOrUpdate nest={nest} />} />
      <Route path={'/:eggId'} element={<EggCreateOrUpdate nest={nest} />} />
    </Routes>
  );
};
