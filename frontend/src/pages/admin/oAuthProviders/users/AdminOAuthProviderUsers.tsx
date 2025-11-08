import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import UserOAuthLinkRow, { userOAuthLinkTableColumns } from './UserOAuthLinkRow';
import getOAuthProviderUsers from '@/api/admin/oauth-providers/users/getOAuthProviderUsers';

export default ({ oauthProvider }: { oauthProvider?: AdminOAuthProvider }) => {
  const [oauthProviderUsers, setOAuthProviderUsers] =
    useState<ResponseMeta<AdminUserOAuthLink>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getOAuthProviderUsers(oauthProvider.uuid, page, search),
    setStoreData: setOAuthProviderUsers,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        OAuth Provider Users
      </Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={userOAuthLinkTableColumns} pagination={oauthProviderUsers} onPageSelect={setPage}>
          {oauthProviderUsers.data.map((userOAuthLink) => (
            <UserOAuthLinkRow key={userOAuthLink.uuid} userOAuthLink={userOAuthLink} />
          ))}
        </Table>
      )}
    </>
  );
};
