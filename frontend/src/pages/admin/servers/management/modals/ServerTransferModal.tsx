import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import React, { useCallback, useEffect, useState } from 'react';
import { ModalProps, Paper, Stack, Title } from '@mantine/core';
import debounce from 'debounce';
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

  const [nodes, setNodes] = useState<Node[]>([]);
  const [doNodesRefetch, setDoNodesRefetch] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');
  const [availableAllocations, setAvailableAllocations] = useState<NodeAllocation[]>([]);
  const [doAllocationsRefetch, setDoAllocationsRefetch] = useState(false);
  const [primaryAllocationsSearch, setPrimaryAllocationsSearch] = useState('');
  const [allocationsSearch, setAllocationsSearch] = useState('');
  const [backups, setBackups] = useState<ServerBackup[]>([]);
  const [doBackupsRefetch, setDoBackupsRefetch] = useState(false);
  const [backupSearch, setBackupSearch] = useState('');

  const fetchNodes = (search: string) => {
    getNodes(1, search)
      .then((response) => {
        setNodes(response.data);

        if (response.total > response.data.length) {
          setDoNodesRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedNodeSearch = useCallback(
    debounce((search: string) => {
      fetchNodes(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doNodesRefetch) {
      setDebouncedNodeSearch(nodeSearch);
    }
  }, [nodeSearch]);

  useEffect(() => {
    fetchNodes('');
  }, []);

  const fetchAvailableAllocations = (search: string) => {
    getAvailableNodeAllocations(selectedNodeUuid, 1, search)
      .then((response) => {
        setAvailableAllocations(response.data);

        if (response.total > response.data.length) {
          setDoAllocationsRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedAllocationSearch = useCallback(
    debounce((search: string) => {
      fetchAvailableAllocations(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doAllocationsRefetch) {
      setDebouncedAllocationSearch(allocationsSearch);
    }
  }, [allocationsSearch]);

  useEffect(() => {
    if (doAllocationsRefetch) {
      setDebouncedAllocationSearch(primaryAllocationsSearch);
    }
  }, [primaryAllocationsSearch]);

  useEffect(() => {
    if (!selectedNodeUuid) {
      return;
    }

    fetchAvailableAllocations('');
  }, [selectedNodeUuid]);

  const fetchBackups = (search: string) => {
    getBackups(server.uuid, 1, search)
      .then((response) => {
        setBackups(response.data);

        if (response.total > response.data.length) {
          setDoBackupsRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedBackupSearch = useCallback(
    debounce((search: string) => {
      fetchBackups(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doBackupsRefetch) {
      setDebouncedBackupSearch(backupSearch);
    }
  }, [backupSearch]);

  useEffect(() => {
    fetchBackups('');
  }, []);

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
        <Code>{nodes.find((node) => node.uuid === selectedNodeUuid)?.name}</Code>?
      </ConfirmationModal>

      <Modal title={'Server Transfer'} onClose={onClose} opened={opened && !openModal}>
        <Stack>
          <Select
            withAsterisk
            label={'Node'}
            placeholder={'Node'}
            value={selectedNodeUuid || ''}
            onChange={(value) => setSelectedNodeUuid(value)}
            data={nodes
              .filter((node) => node.uuid !== server.node.uuid)
              .map((node) => ({
                label: node.name,
                value: node.uuid,
              }))}
            searchable
            searchValue={nodeSearch}
            onSearchChange={setNodeSearch}
          />

          <Select
            label={'Primary Allocation'}
            placeholder={'host:port'}
            value={selectedPrimaryAllocationUuid}
            disabled={!selectedNodeUuid}
            onChange={(value) => setSelectedPrimaryAllocationUuid(value)}
            data={availableAllocations
              .filter((alloc) => !selectedAllocationUuids.includes(alloc.uuid))
              .map((alloc) => ({
                label: formatAllocation(alloc),
                value: alloc.uuid,
              }))}
            searchable
            searchValue={primaryAllocationsSearch}
            onSearchChange={setPrimaryAllocationsSearch}
            allowDeselect
          />

          <MultiSelect
            label={'Primary Allocation'}
            placeholder={'host:port'}
            value={selectedAllocationUuids}
            disabled={!selectedNodeUuid}
            onChange={(value) => setSelectedAllocationUuids(value)}
            data={availableAllocations
              .filter((alloc) => alloc.uuid !== selectedPrimaryAllocationUuid)
              .map((alloc) => ({
                label: formatAllocation(alloc),
                value: alloc.uuid,
              }))}
            searchable
            searchValue={allocationsSearch}
            onSearchChange={setAllocationsSearch}
          />

          <MultiSelect
            label={'Backups to transfer'}
            placeholder={'Backups to transfer'}
            value={selectedBackupUuids}
            onChange={(value) => setSelectedBackupsUuids(value)}
            data={backups.map((backup) => ({
              label: backup.name,
              value: backup.uuid,
            }))}
            searchable
            searchValue={backupSearch}
            onSearchChange={setBackupSearch}
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

          <Button color={'blue'} onClick={() => setOpenModal('confirm')} loading={loading} disabled={!selectedNodeUuid}>
            Transfer
          </Button>
        </Stack>
      </Modal>
    </>
  );
};
