import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { join } from 'pathe';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import copyFile from '@/api/server/files/copyFile';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { serverFilesCopySchema } from '@/lib/schemas/server/files.ts';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

type Props = ModalProps & {
  file: DirectoryEntry;
};

export default function FileCopyModal({ file, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { server, browsingDirectory, browsingEntries, addBrowsingEntry } = useServerStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverFilesCopySchema>>({
    initialValues: {
      name: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverFilesCopySchema),
  });

  const generateNewName = () => {
    const lastDotIndex = file.name.lastIndexOf('.');
    let extension = lastDotIndex > -1 ? file.name.slice(lastDotIndex) : '';
    let baseName = lastDotIndex > -1 ? file.name.slice(0, lastDotIndex) : file.name;

    if (baseName.endsWith('.tar')) {
      extension = '.tar' + extension;
      baseName = baseName.slice(0, -4);
    }

    const lastSlashIndex = file.name.lastIndexOf('/');
    const parent = lastSlashIndex > -1 ? file.name.slice(0, lastSlashIndex + 1) : '';

    let suffix = ' copy';

    for (let i = 0; i <= 50; i++) {
      if (i > 0) {
        suffix = ` copy ${i}`;
      }

      const newName = baseName.concat(suffix, extension);
      const newPath = parent + newName;

      const exists = browsingEntries.data.some((entry) => entry.name === newPath);

      if (!exists) {
        return newName;
      }

      if (i === 50) {
        const timestamp = new Date().toISOString();
        suffix = `copy.${timestamp}`;

        const finalName = baseName.concat(suffix, extension);
        return finalName;
      }
    }

    return baseName.concat(suffix, extension);
  };

  const doCopy = () => {
    setLoading(true);

    copyFile(server.uuid, join(browsingDirectory!, file.name), form.values.name || null)
      .then((entry) => {
        addToast('File has been copied.', 'success');
        onClose();
        addBrowsingEntry(entry);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Copy File' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => doCopy())}>
        <TextInput label='File Name' placeholder='File Name' {...form.getInputProps('name')} />

        <p className='mt-2 text-sm md:text-base break-all'>
          <span className='text-neutral-200'>This file will be created as&nbsp;</span>
          <Code>
            /home/container/
            <span className='text-cyan-200'>
              {join(browsingDirectory!, form.values.name || generateNewName()).replace(/^(\.\.\/|\/)+/, '')}
            </span>
          </Code>
        </p>

        <Group mt='md'>
          <Button type='submit' loading={loading}>
            Copy
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
