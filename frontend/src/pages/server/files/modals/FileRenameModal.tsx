import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import renameFiles from '@/api/server/files/renameFiles.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { serverFilesNameSchema } from '@/lib/schemas/server/files.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

type Props = ModalProps & {
  file: DirectoryEntry;
};

export default function FileRenameModal({ file, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { server, browsingDirectory, browsingEntries, setBrowsingEntries } = useServerStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverFilesNameSchema>>({
    initialValues: {
      name: file.name,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverFilesNameSchema),
  });

  const doRename = () => {
    setLoading(true);

    renameFiles({
      uuid: server.uuid,
      root: browsingDirectory!,
      files: [
        {
          from: file.name,
          to: form.values.name,
        },
      ],
    })
      .then(({ renamed }) => {
        if (renamed < 1) {
          addToast('File could not be renamed.', 'error');
          return;
        }

        addToast('File has been renamed.', 'success');
        setBrowsingEntries({
          ...browsingEntries,
          data: browsingEntries.data.map((entry) =>
            entry.name === file.name ? { ...entry, name: form.values.name } : entry,
          ),
        });
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Rename File' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => doRename())}>
        <TextInput withAsterisk label='File Name' placeholder='File Name' {...form.getInputProps('name')} />

        <Group mt='md'>
          <Button type='submit' loading={loading}>
            Rename
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
