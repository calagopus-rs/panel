import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Table, { ContentWrapper, Pagination, TableBody, TableHead, TableHeader, TableRow } from '@/elements/table/Table';
import { bytesToString } from '@/lib/size';
import { formatTimestamp } from '@/lib/time';

const backups = [
  {
    id: 1,
    name: 'Backup lol',
    size: 3138256,
    created_at: new Date('2025-06-15 00:31:18'),
  },
  {
    id: 2,
    name: 'Backup 2',
    size: 357513,
    created_at: new Date(),
  },
];

const paginationDataset = {
  items: backups,
  pagination: {
    total: backups.length,
    count: backups.length,
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  },
};

export default () => {
  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Backups</h1>
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
                  <TableHeader name={'Size'} />
                  <TableHeader name={'Created At'} />
                </TableHead>

                <TableBody>
                  {backups.map(backup => (
                    <TableRow key={backup.id}>
                      <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
                        <Code>{backup.id}</Code>
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={backup.name}>
                        {backup.name}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {bytesToString(backup.size)}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {formatTimestamp(backup.created_at)}
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
