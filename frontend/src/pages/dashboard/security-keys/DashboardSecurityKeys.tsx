import Spinner from '@/elements/Spinner';
import { useState } from 'react';
import { useUserStore } from '@/stores/user';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import SshKeyRow from './SecurityKeyRow';
import SecurityKeyCreateModal from './modals/SecurityKeyCreateModal';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import getSecurityKeys from '@/api/me/security-keys/getSecurityKeys';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default () => {
  const { securityKeys, setSecurityKeys } = useUserStore();

  const [openModal, setOpenModal] = useState<'create'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getSecurityKeys,
    setStoreData: setSecurityKeys,
  });

  return (
    <>
      <SecurityKeyCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} align={'start'} mb={'md'}>
        <Title order={1} c={'white'}>
          Security Keys
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table columns={['Name', 'Last Used', 'Created', '']} pagination={securityKeys} onPageSelect={setPage}>
            {securityKeys.data.map((key) => (
              <SshKeyRow key={key.uuid} securityKey={key} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
