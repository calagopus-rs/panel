import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getSecurityKeys from '@/api/me/security-keys/getSecurityKeys';
import Button from '@/elements/Button';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useUserStore } from '@/stores/user';
import SecurityKeyCreateModal from './modals/SecurityKeyCreateModal';
import SshKeyRow from './SecurityKeyRow';

export default function DashboardSecurityKeys() {
  const { securityKeys, setSecurityKeys } = useUserStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getSecurityKeys,
    setStoreData: setSecurityKeys,
  });

  return (
    <>
      <SecurityKeyCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='center' mb='md'>
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
    </>
  );
}
