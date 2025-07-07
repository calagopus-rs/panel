import getDatabases from '@/api/server/databases/getDatabases';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import CreateDatabaseButton from './CreateDatabaseButton';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import DatabaseRow from './DatabaseRow';

export default () => {
  const server = useServerStore(state => state.server);
  const { databases, setDatabases } = useServerStore();

  const [loading, setLoading] = useState(databases.data.length === 0);

  useEffect(() => {
    getDatabases(server.uuid).then(data => {
      setDatabases(data);
      setLoading(false);
    });
  }, []);

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Databases</h1>
        <div className="flex gap-2">
          <CreateDatabaseButton />
        </div>
      </div>
      <Table>
        <ContentWrapper>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <TableHead>
                <TableHeader name={'Name'} />
                <TableHeader name={'Address'} />
                <TableHeader name={'Username'} />
                <TableHeader />
              </TableHead>

              <ContextMenuProvider>
                <TableBody>
                  {databases.data.map(database => (
                    <DatabaseRow key={database.id} database={database} />
                  ))}
                </TableBody>
              </ContextMenuProvider>
            </table>

            {loading ? <Spinner.Centered /> : databases.data.length === 0 ? <NoItems /> : null}
          </div>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
