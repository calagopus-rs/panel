import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { join } from 'pathe';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import createDirectory from '@/api/server/files/createDirectory';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { serverFilesDirectoryCreateSchema } from '@/lib/schemas/server/files';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

export default function DirectoryNameModal({ opened, onClose }: ModalProps) {
  const [_, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, browsingDirectory } = useServerStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverFilesDirectoryCreateSchema>>({
    initialValues: {
      name: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverFilesDirectoryCreateSchema),
  });

  const makeDirectory = () => {
    setLoading(true);

    createDirectory(server.uuid, browsingDirectory!, form.values.name)
      .then(() => {
        onClose();
        setSearchParams({ directory: join(browsingDirectory!, form.values.name) });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Create Directory' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => makeDirectory())}>
        <TextInput withAsterisk label='Directory Name' placeholder='Directory Name' {...form.getInputProps('name')} />

        <p className='mt-2 text-sm md:text-base break-all'>
          <span className='text-neutral-200'>This directory will be created as&nbsp;</span>
          <Code>
            /home/container/
            <span className='text-cyan-200'>
              {join(browsingDirectory!, form.values.name).replace(/^(\.\.\/|\/)+/, '')}
            </span>
          </Code>
        </p>

        <Group mt='md'>
          <Button type='submit' loading={loading} disabled={!form.isValid()}>
            Create
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
