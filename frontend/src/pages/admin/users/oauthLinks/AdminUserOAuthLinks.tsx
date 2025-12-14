import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getUserOAuthLinks from '@/api/admin/users/oauthLinks/getUserOAuthLinks.ts';
import Button from '@/elements/Button.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import Table from '@/elements/Table.tsx';
import { adminUserOAuthLinkTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import UserOAuthLinkAddModal from './modals/UserOAuthLinkAddModal.tsx';
import UserOAuthLinkRow from './UserOAuthLinkRow.tsx';
import TextInput from '@/elements/input/TextInput.tsx';

export default function AdminUserOAuthLinks({ user }: { user: User }) {
  const { userOAuthLinks, setUserOAuthLinks } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getUserOAuthLinks(user.uuid, page, search),
    setStoreData: setUserOAuthLinks,
  });

  return (
    <>
      <UserOAuthLinkAddModal user={user} opened={openModal === 'add'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={2}>User OAuth Links</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('add')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={adminUserOAuthLinkTableColumns}
          loading={loading}
          pagination={userOAuthLinks}
          onPageSelect={setPage}
        >
          {userOAuthLinks.data.map((userOAuthLink) => (
            <UserOAuthLinkRow key={userOAuthLink.uuid} user={user} userOAuthLink={userOAuthLink} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
