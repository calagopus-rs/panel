import { Group, Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import getUserOAuthLinks from '@/api/admin/users/oauthLinks/getUserOAuthLinks';
import UserOAuthLinkRow, { userOAuthLinkTableColumns } from './UserOAuthLinkRow';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useAdminStore } from '@/stores/admin';
import { useState } from 'react';
import UserOAuthLinkAddModal from './modals/UserOAuthLinkAddModal';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

export default ({ user }: { user: User }) => {
  const { userOAuthLinks, setUserOAuthLinks } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getUserOAuthLinks(user.uuid, page, search),
    setStoreData: setUserOAuthLinks,
  });

  return (
    <>
      <UserOAuthLinkAddModal user={user} opened={openModal === 'add'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} align={'start'} mb={'md'}>
        <Title order={2}>User OAuth Links</Title>
        <Group>
          <Button onClick={() => setOpenModal('add')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table columns={userOAuthLinkTableColumns} pagination={userOAuthLinks} onPageSelect={setPage}>
            {userOAuthLinks.data.map((userOAuthLink) => (
              <UserOAuthLinkRow key={userOAuthLink.uuid} user={user} userOAuthLink={userOAuthLink} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
