import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getUserOAuthLinks from '@/api/admin/users/oauthLinks/getUserOAuthLinks';
import Button from '@/elements/Button';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import Table from '@/elements/Table';
import { adminUserOAuthLinkTableColumns } from '@/lib/tableColumns';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import UserOAuthLinkAddModal from './modals/UserOAuthLinkAddModal';
import UserOAuthLinkRow from './UserOAuthLinkRow';
import TextInput from '@/elements/input/TextInput';

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

      <Group justify='space-between' align='center' mb='md'>
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
