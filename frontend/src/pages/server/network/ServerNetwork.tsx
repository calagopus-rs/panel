import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Table, { ContentWrapper, Pagination, TableBody, TableHead, TableHeader, TableRow } from '@/elements/table/Table';

const allocations = [
  {
    id: 1,
    ip: '127.0.0.1',
    ip_alias: 'example.com',
    port: 25565,
    notes: '',
    isDefault: true,
  },
  {
    id: 2,
    ip: '127.0.0.1',
    ip_alias: null,
    port: 25566,
    notes: 'Map',
    isDefault: false,
  },
];

const paginationDataset = {
  items: allocations,
  pagination: {
    total: allocations.length,
    count: allocations.length,
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  },
};

export default () => {
  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Network</h1>
        <div className="flex gap-2">
          <Button>Add new</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper checked={false}>
          <Pagination data={paginationDataset} onPageSelect={() => {}}>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <TableHead>
                  <TableHeader name={'ID'} />
                  <TableHeader name={'Hostname'} />
                  <TableHeader name={'Port'} />
                  <TableHeader name={'Note'} />
                  <TableHeader />
                </TableHead>

                <TableBody>
                  {allocations.map(allocation => (
                    <TableRow key={allocation.id}>
                      <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
                        <Code>{allocation.id}</Code>
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        <Code>{allocation.ip_alias ?? allocation.ip}</Code>
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        <Code>{allocation.port}</Code>
                      </td>

                      <td
                        className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap"
                        title={allocation.notes}
                      >
                        {allocation.notes}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {allocation.isDefault ? 'Default' : 'Custom'}
                      </td>
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
};
