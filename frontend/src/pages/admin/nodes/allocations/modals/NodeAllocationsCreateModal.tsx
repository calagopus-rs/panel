import { Group, ModalProps, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import createNodeAllocations from '@/api/admin/nodes/allocations/createNodeAllocations';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import TagsInput from '@/elements/input/TagsInput';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';

export default function NodeAllocationsCreateModal({
  node,
  loadAllocations,
  opened,
  onClose,
}: ModalProps & { node: Node; loadAllocations: () => void }) {
  const { addToast } = useToast();

  const [ip, setIp] = useState('');
  const [ipAlias, setIpAlias] = useState('');
  const [ports, setPorts] = useState<string[]>([]);
  const [resolvedPorts, setResolvedPorts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolved: number[] = [];

    for (const range of ports) {
      const integer = Number(range);

      if (Number.isFinite(integer) && Number.isInteger(integer)) {
        resolved.push(integer);
      } else if (range.includes('-')) {
        const [start, end] = range.split('-');

        const startInteger = Number(start);
        const endInteger = Number(end);

        if (
          Number.isFinite(startInteger) &&
          Number.isInteger(startInteger) &&
          Number.isFinite(endInteger) &&
          Number.isInteger(endInteger)
        ) {
          for (let i = startInteger; i <= endInteger; i++) {
            resolved.push(i);
          }
        }
      } else {
        setPorts((p) => p.filter((r) => r !== range));
      }
    }

    setResolvedPorts(resolved);
  }, [ports]);

  const doCreate = () => {
    setLoading(true);

    createNodeAllocations(node.uuid, {
      ip,
      ipAlias: ipAlias || null,
      ports: resolvedPorts,
    })
      .then(({ created }) => {
        addToast(`${created} Node Allocation${created === 1 ? '' : 's'} created.`, 'success');

        onClose();
        loadAllocations();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Create Node Allocations' onClose={onClose} opened={opened}>
      <Stack>
        <TextInput withAsterisk label='IP' placeholder='IP' value={ip} onChange={(e) => setIp(e.target.value)} />

        <TextInput
          label='IP Alias'
          placeholder='IP Alias'
          value={ipAlias}
          onChange={(e) => setIpAlias(e.target.value)}
        />

        <TagsInput
          label='Port Ranges'
          placeholder='Port Ranges'
          value={ports}
          onChange={(values) => setPorts(values)}
        />

        <Group mt='md'>
          <Button onClick={doCreate} loading={loading} disabled={!ip || !resolvedPorts.length}>
            Create {resolvedPorts.length}
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
