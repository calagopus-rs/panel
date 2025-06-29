import getDatabases from '@/api/server/databases/getDatabases';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import CopyOnClick from '@/elements/CopyOnClick';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, TableBody, TableHead, TableHeader, TableRow } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import CreateDatabaseButton from './CreateDatabaseButton';

export default () => {
  const server = useServerStore(state => state.data);
  const { databases, setDatabases } = useServerStore(state => state.databases);

  const [loading, setLoading] = useState(databases.length === 0);

  useEffect(() => {
    getDatabases(server.uuid).then(data => {
      setDatabases(data);
      setLoading(false);
    });
  }, []);

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Databases</h1>
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
              </TableHead>

              <TableBody>
                {databases.map(database => (
                  <TableRow key={database.id}>
                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={database.name}>
                      {database.name}
                    </td>

                    <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
                      <CopyOnClick content={database.connectionString}>
                        <Code>{database.connectionString}</Code>
                      </CopyOnClick>
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={database.username}>
                      {database.username}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </table>

            {loading ? <Spinner.Centered /> : databases.length === 0 ? <NoItems /> : null}
          </div>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
