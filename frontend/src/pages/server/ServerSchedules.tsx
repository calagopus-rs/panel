import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Table, { ContentWrapper, Pagination, TableBody, TableHead, TableHeader, TableRow } from '@/elements/table/Table';

const schedules = [
  {
    id: 1,
    name: 'Schedule 1',
    last_run: '2023-01-01 00:00:00',
    cron: {
      minute: '0',
      hour: '*',
      day_of_month: '*',
      month: '*',
      day_of_week: '*',
    },
    status: 'active',
  },
  {
    id: 2,
    name: 'Schedule 2',
    last_run: '2024-01-01 00:00:00',
    cron: {
      minute: '0',
      hour: '*',
      day_of_month: '*',
      month: '*',
      day_of_week: '*',
    },
    status: 'inactive',
  },
];

const paginationDataset = {
  items: schedules,
  pagination: {
    total: schedules.length,
    count: schedules.length,
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  },
};

export default function ServerSchedules() {
  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Schedules</h1>
        <div className="flex gap-2">
          <Button>Create new</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper checked={false}>
          <Pagination data={paginationDataset} onPageSelect={() => {}}>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <TableHead>
                  <TableHeader name={'ID'} />
                  <TableHeader name={'Name'} />
                  <TableHeader name={'Frequency'} />
                  <TableHeader name={'Last Run'} />
                  <TableHeader name={'Next Run'} />
                  <TableHeader name={'Status'} />
                </TableHead>

                <TableBody>
                  {schedules.map(schedule => (
                    <TableRow key={schedule.id}>
                      <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
                        <Code>{schedule.id}</Code>
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{schedule.name}</td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {schedule.cron.toString()}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{schedule.last_run}</td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{schedule.last_run}</td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{schedule.status}</td>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </Container>
  );
}
