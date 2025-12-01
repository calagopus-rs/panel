import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getOAuthProviderUsers from '@/api/admin/oauth-providers/users/getOAuthProviderUsers';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import UserOAuthLinkRow, { userOAuthLinkTableColumns } from './UserOAuthLinkRow';
import TextInput from '@/elements/input/TextInput';

export default function AdminOAuthProviderUsers({ oauthProvider }: { oauthProvider?: AdminOAuthProvider }) {
  const [oauthProviderUsers, setOAuthProviderUsers] = useState<ResponseMeta<AdminUserOAuthLink>>(
    getEmptyPaginationSet(),
  );

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getOAuthProviderUsers(oauthProvider.uuid, page, search),
    setStoreData: setOAuthProviderUsers,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>OAuth Provider Users</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table
        columns={userOAuthLinkTableColumns}
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
