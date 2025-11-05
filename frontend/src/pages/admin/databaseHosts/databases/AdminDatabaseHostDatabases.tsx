import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import getDatabaseHostDatabases from '@/api/admin/database-hosts/getDatabaseHostDatabases';
import DatabaseRow, { databaseTableColumns } from './DatabaseRow';

export default ({ databaseHost }: { databaseHost?: AdminDatabaseHost }) => {
  const [databaseHostDatabases, setDatabaseHostDatabases] =
    useState<ResponseMeta<AdminServerDatabase>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getDatabaseHostDatabases(databaseHost.uuid, page, search),
    setStoreData: setDatabaseHostDatabases,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        Database Host Databases
      </Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={databaseTableColumns} pagination={databaseHostDatabases} onPageSelect={setPage}>
          {databaseHostDatabases.data.map((database) => (
            <DatabaseRow key={database.uuid} database={database} />
          ))}
        </Table>
      )}
    </>
  );
};
