import { useState } from 'react';
import getDatabaseHostDatabases from '@/api/admin/database-hosts/getDatabaseHostDatabases.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
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
    <AdminContentContainer title={`Database Host Databases`} titleOrder={2} search={search} setSearch={setSearch}>
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
    </AdminContentContainer>
  );
}
