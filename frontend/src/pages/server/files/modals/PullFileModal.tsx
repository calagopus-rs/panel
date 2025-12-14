import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { join } from 'pathe';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import pullFile from '@/api/server/files/pullFile.ts';
import Button from '@/elements/Button.tsx';
import Code from '@/elements/Code.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { serverFilesPullSchema } from '@/lib/schemas/server/files.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function PullFileModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { server, browsingDirectory } = useServerStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverFilesPullSchema>>({
    initialValues: {
      url: '',
      name: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverFilesPullSchema),
  });

  const makeDirectory = () => {
    setLoading(true);

    pullFile(server.uuid, {
      root: browsingDirectory!,
      url: form.values.url,
      name: form.values.name,
    })
      .then(() => {
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Pull File' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => makeDirectory())}>
        <TextInput withAsterisk label='File URL' placeholder='File URL' {...form.getInputProps('url')} />
        <TextInput
          withAsterisk
          label='File Name'
          placeholder='File Name'
          className='mt-2'
          {...form.getInputProps('name')}
        />

        <p className='mt-2 text-sm md:text-base break-all'>
          <span className='text-neutral-200'>This file will be created as&nbsp;</span>
          <Code>
            /home/container/
            <span className='text-cyan-200'>
              {join(browsingDirectory!, form.values.name ?? '').replace(/^(\.\.\/|\/)+/, '')}
            </span>
          </Code>
        </p>

        <Group mt='md'>
          <Button type='submit' loading={loading} disabled={!form.isValid()}>
            Pull
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
