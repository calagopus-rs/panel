import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createNodeAllocations from '@/api/admin/nodes/allocations/createNodeAllocations.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import TagsInput from '@/elements/input/TagsInput.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { adminNodeAllocationsSchema } from '@/lib/schemas/admin/nodes.ts';
import { useToast } from '@/providers/ToastProvider.tsx';

export default function NodeAllocationsCreateModal({
  node,
  loadAllocations,
  opened,
  onClose,
}: ModalProps & { node: Node; loadAllocations: () => void }) {
  const { addToast } = useToast();

  const [resolvedPorts, setResolvedPorts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminNodeAllocationsSchema>>({
    initialValues: {
      ip: '',
      ipAlias: null,
      ports: [],
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminNodeAllocationsSchema),
  });

  useEffect(() => {
    const resolved: number[] = [];

    for (const range of form.values.ports) {
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
        form.setFieldValue('ports', (p) => p.filter((r) => r !== range));
      }
    }

    setResolvedPorts(resolved);
  }, [form.values.ports]);

  const doCreate = () => {
    setLoading(true);

    createNodeAllocations(node.uuid, {
      ip: form.values.ip,
      ipAlias: form.values.ipAlias || null,
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
        <TextInput withAsterisk label='IP' placeholder='IP' {...form.getInputProps('ip')} />

        <TextInput label='IP Alias' placeholder='IP Alias' {...form.getInputProps('ipAlias')} />

        <TagsInput label='Port Ranges' placeholder='Port Ranges' {...form.getInputProps('ports')} />

        <Group mt='md'>
          <Button onClick={doCreate} loading={loading} disabled={!form.isValid() || !resolvedPorts.length}>
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
