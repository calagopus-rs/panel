import { ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import getAvailableNodeAllocations from '@/api/admin/nodes/allocations/getAvailableNodeAllocations';
import getNodes from '@/api/admin/nodes/getNodes';
import postTransfer from '@/api/admin/servers/postTransfer';
import { httpErrorToHuman } from '@/api/axios';
import getBackups from '@/api/server/backups/getBackups';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import MultiSelect from '@/elements/input/MultiSelect';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import Modal from '@/elements/modals/Modal';
import { archiveFormatLabelMapping, compressionLevelLabelMapping } from '@/lib/enums';
import { formatAllocation } from '@/lib/server';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { useToast } from '@/providers/ToastProvider';

export default function ServerTransferModal({ server, opened, onClose }: ModalProps & { server: AdminServer }) {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'confirm' | null>(null);
  const [selectedNodeUuid, setSelectedNodeUuid] = useState<string | null>(null);
  const [selectedPrimaryAllocationUuid, setSelectedPrimaryAllocationUuid] = useState<string | null>(null);
  const [selectedAllocationUuids, setSelectedAllocationUuids] = useState<string[]>([]);
  const [selectedBackupUuids, setSelectedBackupsUuids] = useState<string[]>([]);
  const [deleteSourceBackups, setDeleteSourceBackups] = useState(false);
  const [archiveFormat, setArchiveFormat] = useState<ArchiveFormat>('tar_lz4');
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('good_compression');
  const [multiplexChannels, setMultiplexChannels] = useState(0);

  const nodes = useSearchableResource<Node>({ fetcher: (search) => getNodes(1, search) });
  const availablePrimaryAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(selectedNodeUuid!, 1, search),
    deps: [selectedNodeUuid],
  });
  const availableAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(selectedNodeUuid!, 1, search),
    deps: [selectedNodeUuid],
  });
  const backups = useSearchableResource<ServerBackup>({ fetcher: (search) => getBackups(server.uuid, 1, search) });

  const closeAll = () => {
    onClose();
    setOpenModal(null);
  };

  const doTransfer = async () => {
    await postTransfer(server.uuid, {
      nodeUuid: selectedNodeUuid!,
      allocationUuid: selectedPrimaryAllocationUuid,
      allocationUuids: selectedAllocationUuids,
      backups: selectedBackupUuids,
      deleteSourceBackups,
      archiveFormat,
      compressionLevel,
      multiplexChannels,
    })
      .then(() => {
        addToast('Server transfer started.', 'success');
        closeAll();
        navigate(`/server/${server.uuidShort}`);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'confirm'}
        onClose={closeAll}
        title='Confirm Server Transfer'
        confirm='Transfer'
        onConfirmed={doTransfer}
      >
        Are you sure you want to transfer <Code>{server.name}</Code> from <Code>{server.node.name}</Code> to{' '}
        <Code>{nodes.items.find((node) => node.uuid === selectedNodeUuid)?.name}</Code>?
      </ConfirmationModal>

      <Modal title='Server Transfer' onClose={onClose} opened={opened && !openModal}>
        <Stack>
          <Select
            withAsterisk
            label='Node'
            placeholder='Node'
            value={selectedNodeUuid || ''}
            onChange={(value) => setSelectedNodeUuid(value)}
            data={nodes.items
              .filter((node) => node.uuid !== server.node.uuid)
              .map((node) => ({
                label: node.name,
                value: node.uuid,
              }))}
            searchable
            searchValue={nodes.search}
            onSearchChange={nodes.setSearch}
          />

          <Select
            label='Primary Allocation'
            placeholder='Primary Allocation'
            value={selectedPrimaryAllocationUuid}
            disabled={!selectedNodeUuid}
            onChange={(value) => setSelectedPrimaryAllocationUuid(value)}
            data={availableAllocations.items
              .filter((alloc) => !selectedAllocationUuids.includes(alloc.uuid))
              .map((alloc) => ({
                label: formatAllocation(alloc),
                value: alloc.uuid,
              }))}
            searchable
            searchValue={availablePrimaryAllocations.search}
            onSearchChange={availablePrimaryAllocations.setSearch}
            allowDeselect
          />

          <MultiSelect
            label='Additional Allocations'
            placeholder='Additional Allocations'
            value={selectedAllocationUuids}
            disabled={!selectedNodeUuid}
            onChange={(value) => setSelectedAllocationUuids(value)}
            data={availableAllocations.items
              .filter((alloc) => alloc.uuid !== selectedPrimaryAllocationUuid)
              .map((alloc) => ({
                label: formatAllocation(alloc),
                value: alloc.uuid,
              }))}
            searchable
            searchValue={availableAllocations.search}
            onSearchChange={availableAllocations.setSearch}
          />

          <MultiSelect
            label='Backups to transfer'
            placeholder='Backups to transfer'
            value={selectedBackupUuids}
            onChange={(value) => setSelectedBackupsUuids(value)}
            data={backups.items.map((backup) => ({
              label: backup.name,
              value: backup.uuid,
            }))}
            searchable
            searchValue={backups.search}
            onSearchChange={backups.setSearch}
          />

          <Switch
            label='Delete source backups'
            description='Deletes the transferred backups on the source node once transfer finishes'
            checked={deleteSourceBackups}
            onChange={(e) => setDeleteSourceBackups(e.target.checked)}
          />

          <Select
            withAsterisk
            label='Archive Format'
            value={archiveFormat}
            onChange={(value) => setArchiveFormat(value as ArchiveFormat)}
            data={Object.entries(archiveFormatLabelMapping)
              .filter(([value]) => !['zip', 'seven_zip'].includes(value))
              .map(([value, label]) => ({
                value,
                label,
              }))}
          />

          <Select
            withAsterisk
            label='Compression Level'
            value={compressionLevel}
            onChange={(value) => setCompressionLevel(value as CompressionLevel)}
            disabled={archiveFormat === 'tar'}
            data={Object.entries(compressionLevelLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
          />

          <NumberInput
            withAsterisk
            label='Multiplex Channels'
            placeholder='Multiplex Channels'
            description='Add additional HTTP connections (and therefore also threads) for transfering split archives, total streams is 1 + multiplex channels'
            min={0}
            value={multiplexChannels}
            onChange={(value) => setMultiplexChannels(Number(value) || 0)}
          />

          <Button color='blue' onClick={() => setOpenModal('confirm')} disabled={!selectedNodeUuid}>
            Transfer
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
