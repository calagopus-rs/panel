import { useState } from 'react';
import getUserServers from '@/api/admin/users/servers/getUserServers.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Switch from '@/elements/input/Switch.tsx';
import Table from '@/elements/Table.tsx';
import { serverTableColumns } from '@/lib/tableColumns.ts';
import ServerRow from '@/pages/admin/servers/ServerRow.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';

export default function AdminUserServers({ user }: { user: User }) {
  const [showOwnedUserServers, setShowOwnedUserServers] = useState(false);
  const [userServers, setUserServers] = useState<ResponseMeta<AdminServer>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getUserServers(user.uuid, page, search, showOwnedUserServers),
    setStoreData: setUserServers,
    deps: [showOwnedUserServers],
  });

  return (
    <AdminContentContainer
      title='User Servers'
      titleOrder={2}
      search={search}
      setSearch={setSearch}
      contentRight={
        <Switch
          label="Only show users' owned servers"
          checked={showOwnedUserServers}
          onChange={(e) => setShowOwnedUserServers(e.currentTarget.checked)}
        />
      }
    >
      <Table columns={serverTableColumns} loading={loading} pagination={userServers} onPageSelect={setPage}>
        {userServers.data.map((server) => (
          <ServerRow key={server.uuid} server={server} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
