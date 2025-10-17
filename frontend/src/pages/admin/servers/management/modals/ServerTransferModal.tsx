import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';
import { ModalProps, Stack } from '@mantine/core';
import getNodes from '@/api/admin/nodes/getNodes';
import Select from '@/elements/input/Select';
import { formatAllocation } from '@/lib/server';
import MultiSelect from '@/elements/input/MultiSelect';
import getAvailableNodeAllocations from '@/api/admin/nodes/allocations/getAvailableNodeAllocations';
import getBackups from '@/api/server/backups/getBackups';
import Switch from '@/elements/input/Switch';
import { archiveFormatLabelMapping, compressionLevelLabelMapping } from '@/lib/enums';
import Button from '@/elements/Button';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import Code from '@/elements/Code';
import postTransfer from '@/api/admin/servers/postTransfer';
import { load } from '@/lib/debounce';
import { useNavigate } from 'react-router';
import Modal from '@/elements/modals/Modal';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import NumberInput from '@/elements/input/NumberInput';

export default ({ server, opened, onClose }: ModalProps & { server: AdminServer }) => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'confirm'>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNodeUuid, setSelectedNodeUuid] = useState(null);
  const [selectedPrimaryAllocationUuid, setSelectedPrimaryAllocationUuid] = useState(null);
  const [selectedAllocationUuids, setSelectedAllocationUuids] = useState<string[]>([]);
  const [selectedBackupUuids, setSelectedBackupsUuids] = useState<string[]>([]);
  const [deleteSourceBackups, setDeleteSourceBackups] = useState(false);
  const [archiveFormat, setArchiveFormat] = useState<ArchiveFormat>('tar_zstd');
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('good_compression');
  const [multiplexChannels, setMultiplexChannels] = useState(0);

  const nodes = useSearchableResource<Node>({ fetcher: (search) => getNodes(1, search) });
  const availablePrimaryAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(selectedNodeUuid, 1, search),
    deps: [selectedNodeUuid],
  });
  const availableAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(selectedNodeUuid, 1, search),
    deps: [selectedNodeUuid],
  });
  const backups = useSearchableResource<ServerBackup>({ fetcher: (search) => getBackups(server.uuid, 1, search) });

  const closeAll = () => {
    onClose();
    setOpenModal(null);
  };

  const doTransfer = () => {
    load(true, setLoading);

    postTransfer(server.uuid, {
      nodeUuid: selectedNodeUuid,
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
        navigate('/admin/servers');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'confirm'}
        onClose={closeAll}
        title={'Confirm Server Transfer'}
        confirm={'Transfer'}
        onConfirmed={doTransfer}
      >
        Are you sure you want to transfer <Code>{server.name}</Code> from <Code>{server.node.name}</Code> to{' '}
        <Code>{nodes.items.find((node) => node.uuid === selectedNodeUuid)?.name}</Code>?
      </ConfirmationModal>

      <Modal title={'Server Transfer'} onClose={onClose} opened={opened && !openModal}>
        <Stack>
          <Select
            withAsterisk
            label={'Node'}
            placeholder={'Node'}
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
            label={'Primary Allocation'}
            placeholder={'Primary Allocation'}
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
            label={'Additional Allocations'}
            placeholder={'Additional Allocations'}
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
            label={'Backups to transfer'}
            placeholder={'Backups to transfer'}
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
            label={'Delete source backups'}
            checked={deleteSourceBackups}
            onChange={(e) => setDeleteSourceBackups(e.target.checked)}
          />

          <Select
            label={'Archive Format'}
            value={archiveFormat}
            onChange={(value) => setArchiveFormat(value as ArchiveFormat)}
            data={Object.entries(archiveFormatLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
          />

          <Select
            label={'Compression Level'}
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
            label={'Multiplex Channels'}
            placeholder={'Multiplex Channels'}
            min={0}
            value={multiplexChannels}
            onChange={(value) => setMultiplexChannels(Number(value) || 0)}
          />

          <Button color={'blue'} onClick={() => setOpenModal('confirm')} loading={loading} disabled={!selectedNodeUuid}>
            Transfer
          </Button>
        </Stack>
      </Modal>
    </>
  );
};
