import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getSshKeys from '@/api/me/ssh-keys/getSshKeys.ts';
import Button from '@/elements/Button.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useUserStore } from '@/stores/user.ts';
import SshKeyCreateModal from './modals/SshKeyCreateModal.tsx';
import SshKeyImportModal from './modals/SshKeyImportModal.tsx';
import SshKeyRow from './SshKeyRow.tsx';

export default function DashboardSshKeys() {
  const { t } = useTranslations();
  const { sshKeys, setSshKeys } = useUserStore();

  const [openModal, setOpenModal] = useState<'create' | 'import' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getSshKeys,
    setStoreData: setSshKeys,
  });

  return (
    <AccountContentContainer title={t('pages.account.sshKeys.title', {})}>
      <SshKeyCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />
      <SshKeyImportModal opened={openModal === 'import'} onClose={() => setOpenModal(null)} />

      <Group justify='space-between' align='start' mb='md'>
        <Title order={1} c='white'>
          {t('pages.account.sshKeys.title', {})}
        </Title>
        <Group>
          <TextInput
            placeholder={t('common.input.search', {})}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            w={250}
          />
          <Button
            onClick={() => setOpenModal('import')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faDownload} />}
          >
            {t('pages.account.sshKeys.button.import', {})}
          </Button>
          <Button onClick={() => setOpenModal('create')} color='blue' leftSection={<FontAwesomeIcon icon={faPlus} />}>
            {t('common.button.create', {})}
          </Button>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={[
            t('common.table.columns.name', {}),
            t('pages.account.sshKeys.table.columns.fingerprint', {}),
            t('common.table.columns.created', {}),
            '',
          ]}
          loading={loading}
          pagination={sshKeys}
          onPageSelect={setPage}
        >
          {sshKeys.data.map((key) => (
            <SshKeyRow key={key.uuid} sshKey={key} />
          ))}
        </Table>
      </ContextMenuProvider>
    </AccountContentContainer>
  );
}
