import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import getPermissions from '@/api/getPermissions';
import createSubuser from '@/api/server/subusers/createSubuser';
import getSubusers from '@/api/server/subusers/getSubusers';
import Button from '@/elements/Button';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useToast } from '@/providers/ToastProvider';
import { useGlobalStore } from '@/stores/global';
import { useServerStore } from '@/stores/server';
import SubuserCreateOrUpdateModal from './modals/SubuserCreateOrUpdateModal';
import SubuserRow from './SubuserRow';

export default function ServerSubusers() {
  const { addToast } = useToast();
  const { server, subusers, setSubusers, addSubuser } = useServerStore();
  const { setAvailablePermissions } = useGlobalStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);

  useEffect(() => {
    getPermissions().then((res) => {
      setAvailablePermissions(res);
    });
  }, []);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getSubusers(server.uuid, page, search),
    setStoreData: setSubusers,
  });

  const doCreate = (email: string, permissions: string[], ignoredFiles: string[], captcha: string | null) => {
    createSubuser(server.uuid, { email, permissions, ignoredFiles, captcha })
      .then((subuser) => {
        addSubuser(subuser);
        addToast('Subuser created.', 'success');
        setOpenModal(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <SubuserCreateOrUpdateModal
        onCreate={doCreate}
        opened={openModal === 'create'}
        onClose={() => setOpenModal(null)}
      />

      <Group justify='space-between' align='center' mb='md'>
        <Title order={1} c='white'>
          Subusers
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('create')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={['', 'Username', '2FA Enabled', 'Permissions', 'Ignored Files', '']}
          loading={loading}
          pagination={subusers}
          onPageSelect={setPage}
        >
          {subusers.data.map((su) => (
            <SubuserRow subuser={su} key={su.user.uuid} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
