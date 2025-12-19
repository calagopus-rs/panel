import { useState } from 'react';
import getNodeBackups from '@/api/admin/nodes/backups/getNodeBackups.ts';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Switch from '@/elements/input/Switch.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import NodeBackupRow from './NodeBackupRow.tsx';

export default function AdminNodeBackups({ node }: { node: Node }) {
  const { nodeBackups, setNodeBackups } = useAdminStore();

  const [showDetachedNodeBackups, setShowDetachedNodeBackups] = useState(false);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getNodeBackups(node.uuid, page, search, showDetachedNodeBackups),
    setStoreData: setNodeBackups,
    deps: [showDetachedNodeBackups],
  });

  return (
    <AdminContentContainer
      title='Node Backups'
      titleOrder={2}
      search={search}
      setSearch={setSearch}
      contentRight={
        <Switch
          label='Only show detached backups'
          checked={showDetachedNodeBackups}
          onChange={(e) => setShowDetachedNodeBackups(e.currentTarget.checked)}
        />
      }
    >
      <ContextMenuProvider>
        <Table
          columns={['Name', 'Server', 'Checksum', 'Size', 'Files', 'Created At', 'Locked?', '']}
          loading={loading}
          pagination={nodeBackups}
          onPageSelect={setPage}
        >
          {nodeBackups.data.map((backup) => (
            <NodeBackupRow key={backup.uuid} node={node} backup={backup} />
          ))}
        </Table>
      </ContextMenuProvider>
    </AdminContentContainer>
  );
}
