import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getDatabaseHostDatabases from '@/api/admin/database-hosts/getDatabaseHostDatabases';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import DatabaseRow, { databaseTableColumns } from './DatabaseRow';
import TextInput from '@/elements/input/TextInput';

export default function AdminDatabaseHostDatabases({ databaseHost }: { databaseHost?: AdminDatabaseHost }) {
  const [databaseHostDatabases, setDatabaseHostDatabases] = useState<ResponseMeta<AdminServerDatabase>>(
    getEmptyPaginationSet(),
  );

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getDatabaseHostDatabases(databaseHost.uuid, page, search),
    setStoreData: setDatabaseHostDatabases,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Database Host Databases</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table columns={databaseTableColumns} loading={loading} pagination={databaseHostDatabases} onPageSelect={setPage}>
        {databaseHostDatabases.data.map((database) => (
          <DatabaseRow key={database.uuid} database={database} />
        ))}
      </Table>
    </>
  );
}
