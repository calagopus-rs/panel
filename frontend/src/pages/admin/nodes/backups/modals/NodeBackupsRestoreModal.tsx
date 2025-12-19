import { Group, ModalProps, Stack, Switch } from '@mantine/core';
import { useEffect, useState } from 'react';
import restoreNodeBackup from '@/api/admin/nodes/backups/restoreNodeBackup.ts';
import getServers from '@/api/admin/servers/getServers.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import Select from '@/elements/input/Select.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useSearchableResource } from '@/plugins/useSearchableResource.ts';
import { useToast } from '@/providers/ToastProvider.tsx';

type Props = ModalProps & {
  node: Node;
  backup: AdminServerBackup;
};

export default function NodeBackupsRestoreModal({ node, backup, opened, onClose }: Props) {
  const { addToast } = useToast();

  const [truncate, setTruncate] = useState(false);
  const [selectedServer, setSelectedServer] = useState<AdminServer | null>(null);
  const [loading, setLoading] = useState(false);

  const servers = useSearchableResource<AdminServer>({ fetcher: (search) => getServers(1, search) });

  useEffect(() => {
    if (!opened) {
      servers.setSearch('');
      setSelectedServer(null);
    }
  }, [opened]);

  const doRestore = () => {
    setLoading(true);

    restoreNodeBackup(node.uuid, backup.uuid, { serverUuid: selectedServer!.uuid, truncateDirectory: truncate })
      .then(() => {
        onClose();
        addToast(`Restoring backup to ${selectedServer?.name}...`, 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Restore Node Backup' onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label='Server'
          placeholder='Server'
          value={selectedServer?.uuid}
          onChange={(value) => setSelectedServer(servers.items.find((m) => m.uuid === value) ?? null)}
          data={servers.items.map((server) => ({
            label: server.name,
            value: server.uuid,
          }))}
          searchable
          searchValue={servers.search}
          onSearchChange={servers.setSearch}
        />

        <Switch
          label='Do you want to empty the filesystem of this server before restoring the backup?'
          name='truncate'
          checked={truncate}
          onChange={(e) => setTruncate(e.target.checked)}
        />
      </Stack>

      <Group mt='md'>
        <Button color={truncate ? 'red' : undefined} onClick={doRestore} loading={loading}>
          Restore
        </Button>
        <Button variant='default' onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
}
