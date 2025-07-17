import { httpErrorToHuman } from '@/api/axios';
import createAllocation from '@/api/server/allocations/createAllocation';
import getAllocations from '@/api/server/allocations/getAllocations';
import createBackup from '@/api/server/backups/createBackup';
import getBackups from '@/api/server/backups/getBackups';
import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, {
  ContentWrapper,
  NoItems,
  Pagination,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
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
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  const onPageSelect = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  useEffect(() => {
    getLocations(page)
      .then(data => {
        setLocations(data);
        setLoading(false);
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page]);

  return (
    <>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Locations</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/locations/new')}>New Location</Button>
        </div>
      </div>
      <Table>
        <Pagination data={locations} onPageSelect={onPageSelect}>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <TableHead>
                <TableHeader name="ID" />
                <TableHeader name="Short Name" />
                <TableHeader name="Long Name" />
              </TableHead>

              <ContextMenuProvider>
                <TableBody>
                  {locations.data.map(location => (
                    <LocationRow key={location.id} location={location} />
                  ))}
                </TableBody>
              </ContextMenuProvider>
            </table>

            {loading ? <Spinner.Centered /> : locations.data.length === 0 ? <NoItems /> : null}
          </div>
        </Pagination>
      </Table>
    </>
  );
};

export default () => {
  return (
    <Container>
      <Routes>
        <Route path="/" element={<LocationsContainer />} />
        <Route path="/new" element={<LocationCreateOrUpdate />} />
        <Route path="/:id" element={<LocationCreateOrUpdate />} />
      </Routes>
    </Container>
  );
};
