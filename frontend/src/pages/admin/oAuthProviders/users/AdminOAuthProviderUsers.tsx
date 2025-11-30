import { Title } from '@mantine/core';
import { useState } from 'react';
import getOAuthProviderUsers from '@/api/admin/oauth-providers/users/getOAuthProviderUsers';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { adminOAuthProviderUsersTableColumns } from '@/lib/tableColumns';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import UserOAuthLinkRow from './UserOAuthLinkRow';

export default function AdminOAuthProviderUsers({ oauthProvider }: { oauthProvider: AdminOAuthProvider }) {
  const [oauthProviderUsers, setOAuthProviderUsers] = useState<ResponseMeta<AdminUserOAuthLink>>(
    getEmptyPaginationSet(),
  );

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getOAuthProviderUsers(oauthProvider.uuid, page, search),
    setStoreData: setOAuthProviderUsers,
  });

  return (
    <>
      <Title order={2} mb='md'>
        OAuth Provider Users
      </Title>

      <Table
        columns={adminOAuthProviderUsersTableColumns}
        loading={loading}
        pagination={oauthProviderUsers}
        onPageSelect={setPage}
      >
        {oauthProviderUsers.data.map((userOAuthLink) => (
          <UserOAuthLinkRow key={userOAuthLink.uuid} userOAuthLink={userOAuthLink} />
        ))}
      </Table>
    </>
  );
}
