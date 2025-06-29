import getSchedules from '@/api/server/schedules/getSchedules';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import ScheduleRow from './ScheduleRow';

export default () => {
  const server = useServerStore(state => state.data);
  const { schedules, setSchedules } = useServerStore(state => state.schedules);

  const [loading, setLoading] = useState(schedules.length === 0);

  useEffect(() => {
    getSchedules(server.uuid).then(data => {
      setSchedules(data);
      setLoading(false);
    });
  }, []);

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Schedules</h1>
        <div className="flex gap-2">
          <Button>Create new</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <TableHead>
                <TableHeader name={'Name'} />
                <TableHeader name={'Frequency'} />
                <TableHeader name={'Last Run'} />
                <TableHeader name={'Next Run'} />
                <TableHeader name={'Status'} />
              </TableHead>

              <TableBody>
                {schedules.map(schedule => (
                  <ScheduleRow key={schedule.id} schedule={schedule} />
                ))}
              </TableBody>
            </table>

            {loading ? <Spinner.Centered /> : schedules.length === 0 ? <NoItems /> : null}
          </div>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
