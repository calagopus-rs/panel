import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Table, { ContentWrapper, Pagination, TableBody, TableHead, TableHeader, TableRow } from '@/elements/table/Table';

const databases = [
  {
    id: 1,
    name: 's1_databaas',
    host: {
      ip: '127.0.0.1',
      port: 3306,
    },
    username: 's1_databaas_u1',
    connections_from: '%',
  },
  {
    id: 2,
    name: 's1_db',
    host: {
      ip: '127.0.0.1',
      port: 3306,
    },
    username: 's1_db_u1',
    connections_from: '%',
  },
];

const paginationDataset = {
  items: databases,
  pagination: {
    total: databases.length,
    count: databases.length,
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  },
};

export default function ServerDatabases() {
  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Databases</h1>
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
                  <TableHeader
                    name={'ID'}
                    // direction={sort === 'id' ? (sortDirection ? 1 : 2) : null}
                    // onClick={() => setSort('id')}
                  />
                  <TableHeader
                    name={'Name'}
                    // direction={sort === 'name' ? (sortDirection ? 1 : 2) : null}
                    // onClick={() => setSort('name')}
                  />
                  <TableHeader name={'Address'} />
                  <TableHeader name={'Username'} />
                </TableHead>

                <TableBody>
                  {databases.map(database => (
                    <TableRow key={database.id}>
                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {/* <CopyOnClick text={database.id.toString()}> */}
                        <code className="font-mono bg-neutral-900 rounded py-1 px-2">{database.id}</code>
                        {/* </CopyOnClick> */}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {/* <NavLink to={`${match.url}/${database.id}`} className="text-primary-400 hover:text-primary-300"> */}
                        {database.name}
                        {/* </NavLink> */}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {/* <CopyOnClick text={database.getAddress()}> */}
                        <code className="font-mono bg-neutral-900 rounded py-1 px-2">
                          {database.host.ip}:{database.host.port}
                        </code>
                        {/* </CopyOnClick> */}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">{database.username}</td>
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
