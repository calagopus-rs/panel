import { httpErrorToHuman } from '@/api/axios';
import { Button } from '@/elements/button';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useAdminStore } from '@/stores/admin';
import getLocations from '@/api/admin/locations/getLocations';
import LocationRow from './LocationRow';
import LocationCreateOrUpdate from './LocationCreateOrUpdate';

const LocationsContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { locations, setLocations } = useAdminStore();

  const [loading, setLoading] = useState(locations.data.length === 0);
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
    getLocations(page, search)
      .then((data) => {
        setLocations(data);
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Locations</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => navigate('/admin/locations/new')}>New Location</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={locations} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'ID'} />
                  <TableHeader name={'Short Name'} />
                  <TableHeader name={'Long Name'} />
                  <TableHeader name={'Backup Disk'} />
                  <TableHeader name={'Nodes'} />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {locations.data.map((location) => (
                      <LocationRow key={location.uuid} location={location} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : locations.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<LocationsContainer />} />
      <Route path={'/new'} element={<LocationCreateOrUpdate />} />
      <Route path={'/:id'} element={<LocationCreateOrUpdate />} />
    </Routes>
  );
};
