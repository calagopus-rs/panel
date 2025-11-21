import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getUserOAuthLinks from '@/api/admin/users/oauthLinks/getUserOAuthLinks';
import Button from '@/elements/Button';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import UserOAuthLinkAddModal from './modals/UserOAuthLinkAddModal';
import UserOAuthLinkRow, { userOAuthLinkTableColumns } from './UserOAuthLinkRow';

export default function AdminUserOAuthLinks({ user }: { user: User }) {
  const { userOAuthLinks, setUserOAuthLinks } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getUserOAuthLinks(user.uuid, page, search),
    setStoreData: setUserOAuthLinks,
  });

  return (
    <>
      <UserOAuthLinkAddModal user={user} opened={openModal === 'add'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>User OAuth Links</Title>
        <Group>
          <Button onClick={() => setOpenModal('add')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table columns={userOAuthLinkTableColumns} loading={loading} pagination={userOAuthLinks} onPageSelect={setPage}>
          {userOAuthLinks.data.map((userOAuthLink) => (
            <UserOAuthLinkRow key={userOAuthLink.uuid} user={user} userOAuthLink={userOAuthLink} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
