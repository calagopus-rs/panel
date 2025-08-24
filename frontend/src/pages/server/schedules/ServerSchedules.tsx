import getSchedules from '@/api/server/schedules/getSchedules';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import ScheduleRow from './ScheduleRow';
import { useSearchParams } from 'react-router';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { server, schedules, setSchedules } = useServerStore();

  const [loading, setLoading] = useState(schedules.data.length === 0);
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
    getSchedules(server.uuid, page, search).then((data) => {
      setSchedules(data);
      load(false, setLoading);
    });
  }, [page, search]);

  return (
    <>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Schedules</h1>
        <div className={'flex gap-2'}>{/* todo */}</div>
      </div>
      {/* <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={schedules} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'Name'} />
                  <TableHeader name={'Last Run'} />
                  <TableHeader name={'Last Failure'} />
                  <TableHeader name={'Status'} />
                </TableHead>

                <TableBody>
                  {schedules.data.map((schedule) => (
                    <ScheduleRow key={schedule.uuid} schedule={schedule} />
                  ))}
                </TableBody>
              </table>

              {loading ? <Spinner.Centered /> : schedules.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table> */}
    </>
  );
};
