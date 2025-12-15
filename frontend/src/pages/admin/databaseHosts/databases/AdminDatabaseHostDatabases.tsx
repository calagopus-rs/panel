import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getDatabaseHostDatabases from '@/api/admin/database-hosts/getDatabaseHostDatabases.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { databaseHostDatabaseTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import DatabaseRow from './DatabaseRow.tsx';

export default function AdminDatabaseHostDatabases({ databaseHost }: { databaseHost: AdminDatabaseHost }) {
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

      <Table
        columns={databaseHostDatabaseTableColumns}
        loading={loading}
        pagination={databaseHostDatabases}
        onPageSelect={setPage}
      >
        {databaseHostDatabases.data.map((database) => (
          <DatabaseRow key={database.uuid} database={database} />
        ))}
      </Table>
    </>
  );
}
