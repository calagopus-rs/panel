import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getSshKeys from '@/api/me/ssh-keys/getSshKeys';
import Button from '@/elements/Button';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import TextInput from '@/elements/input/TextInput';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useUserStore } from '@/stores/user';
import SshKeyCreateModal from './modals/SshKeyCreateModal';
import SshKeyImportModal from './modals/SshKeyImportModal';
import SshKeyRow from './SshKeyRow';

export default function DashboardSshKeys() {
  const { sshKeys, setSshKeys } = useUserStore();

  const [openModal, setOpenModal] = useState<'create' | 'import'>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getSshKeys,
    setStoreData: setSshKeys,
  });

  return (
    <>
      <SshKeyCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />
      <SshKeyImportModal opened={openModal === 'import'} onClose={() => setOpenModal(null)} />

      <Group justify={'space-between'} align={'start'} mb={'md'}>
        <Title order={1} c={'white'}>
          SSH Keys
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => setOpenModal('import')}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faDownload} />}
          >
            Import
          </Button>
          <Button onClick={() => setOpenModal('create')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table columns={['Name', 'Fingerprint', 'Created', '']} pagination={sshKeys} onPageSelect={setPage}>
            {sshKeys.data.map((key) => (
              <SshKeyRow key={key.uuid} sshKey={key} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
}
