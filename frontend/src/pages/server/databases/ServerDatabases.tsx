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
import { useServerStore } from '@/stores/server.ts';
import DatabaseRow from './DatabaseRow.tsx';
import DatabaseCreateModal from './modals/DatabaseCreateModal.tsx';

export default function ServerDatabases() {
  const { server, databases, setDatabases } = useServerStore();

  const [openModal, setOpenModal] = useState<'create' | null>(null);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getDatabases(server.uuid, page, search),
    setStoreData: setDatabases,
  });

  return (
    <ServerContentContainer
      title='Databases'
      subtitle={`${databases.total} of ${server.featureLimits.databases} maximum databases created.`}
      search={search}
      setSearch={setSearch}
      contentRight={
        <ConditionalTooltip
          enabled={databases.total >= server.featureLimits.databases}
          label={`This server is limited to ${server.featureLimits.databases} databases.`}
        >
          <Button
            disabled={databases.total >= server.featureLimits.databases}
            onClick={() => setOpenModal('create')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </ConditionalTooltip>
      }
    >
      <DatabaseCreateModal opened={openModal === 'create'} onClose={() => setOpenModal(null)} />

      <ContextMenuProvider>
        <Table
          columns={['Name', 'Type', 'Address', 'Username', 'Size', 'Locked?', '']}
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
