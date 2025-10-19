import Spinner from '@/elements/Spinner';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/stores/user';
import getSshKeys from '@/api/me/ssh-keys/getSshKeys';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import SshKeyRow from './SshKeyRow';
import SshKeyCreateModal from './modals/SshKeyCreateModal';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import SshKeyImportModal from './modals/SshKeyImportModal';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default () => {
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

      <Group justify={'space-between'} mb={'md'}>
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
};
