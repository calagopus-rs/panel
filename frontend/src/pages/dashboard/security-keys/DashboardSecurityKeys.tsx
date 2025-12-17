import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getSecurityKeys from '@/api/me/security-keys/getSecurityKeys.ts';
import Button from '@/elements/Button.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useUserStore } from '@/stores/user.ts';
import SecurityKeyCreateModal from './modals/SecurityKeyCreateModal.tsx';
import SshKeyRow from './SecurityKeyRow.tsx';

export default function DashboardSecurityKeys() {
  const { securityKeys, setSecurityKeys } = useUserStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getSecurityKeys,
    setStoreData: setSecurityKeys,
  });

  return (
    <AccountContentContainer title='Security Keys'>
      <SecurityKeyCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={1} c='white'>
          Security Keys
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
          columns={['Name', 'Last Used', 'Created', '']}
          loading={loading}
          pagination={securityKeys}
          onPageSelect={setPage}
        >
          {securityKeys.data.map((key) => (
            <SshKeyRow key={key.uuid} securityKey={key} />
          ))}
        </Table>
      </ContextMenuProvider>
    </AccountContentContainer>
  );
}
