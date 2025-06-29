import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Table, {
  ContentWrapper,
  NoItems,
  Pagination,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/elements/table/Table';
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const users = [
  {
    id: 1,
    email: 'johndough@example.com',
    two_factor_enabled: true,
    permissions: ['permission.1', 'permission.2'],
  },
  {
    id: 2,
    email: 'emmastrawberry@example.com',
    two_factor_enabled: false,
    permissions: [],
  },
];

const paginationDataset = {
  items: users,
  pagination: {
    total: users.length,
    count: users.length,
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  },
};

export default () => {
  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Users</h1>
        <div className="flex gap-2">
          <Button>Add</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper checked={false}>
          <Pagination data={paginationDataset} onPageSelect={() => {}}>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <TableHead>
                  <TableHeader name={'Id'} />
                  <TableHeader name={'Email'} />
                  <TableHeader name={'2FA Enabled'} />
                  <TableHeader name={'Permissions'} />
                </TableHead>

                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
                        <Code>{user.id}</Code>
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={user.email}>
                        {user.email}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {user.two_factor_enabled ? (
                          <FontAwesomeIcon className="text-green-500" icon={faLock} />
                        ) : (
                          <FontAwesomeIcon className="text-red-500" icon={faLockOpen} />
                        )}
                      </td>

                      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                        {user.permissions.length}
                      </td>
                    </TableRow>
                  ))}
                </TableBody>
              </table>

              {users.length === 0 && <NoItems />}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
