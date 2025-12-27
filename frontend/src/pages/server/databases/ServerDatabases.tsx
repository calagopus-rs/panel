import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import getDatabases from '@/api/server/databases/getDatabases.ts';
import Button from '@/elements/Button.tsx';
import ConditionalTooltip from '@/elements/ConditionalTooltip.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import DatabaseRow from './DatabaseRow.tsx';
import DatabaseCreateModal from './modals/DatabaseCreateModal.tsx';

export default function ServerDatabases() {
  const { t } = useTranslations();
  const { server, databases, setDatabases } = useServerStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getDatabases(server.uuid, page, search),
    setStoreData: setDatabases,
  });

  return (
    <ServerContentContainer
      title={t('pages.server.databases.title', {})}
      subtitle={t('pages.server.databases.subtitle', {
        current: databases.total,
        max: server.featureLimits.databases,
      })}
      search={search}
      setSearch={setSearch}
      contentRight={
        <ConditionalTooltip
          enabled={databases.total >= server.featureLimits.databases}
          label={t('pages.server.databases.tooltip.limitReached', { max: server.featureLimits.databases })}
        >
          <Button
            disabled={databases.total >= server.featureLimits.databases}
            onClick={() => setOpenModal('create')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            {t('common.button.create', {})}
          </Button>
        </ConditionalTooltip>
      }
    >
      <DatabaseCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <ContextMenuProvider>
        <Table
          columns={[
            t('common.table.columns.name', {}),
            t('pages.server.databases.table.columns.type', {}),
            t('pages.server.databases.table.columns.address', {}),
            t('common.table.columns.username', {}),
            t('common.table.columns.size', {}),
            t('pages.server.databases.table.columns.locked', {}),
            '',
          ]}
          loading={loading}
          pagination={databases}
          onPageSelect={setPage}
        >
          {databases.data.map((database) => (
            <DatabaseRow database={database} key={database.uuid} />
          ))}
        </Table>
      </ContextMenuProvider>
    </ServerContentContainer>
  );
}
