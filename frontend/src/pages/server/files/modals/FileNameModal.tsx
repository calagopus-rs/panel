import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { serverFilesNameSchema } from '@/lib/schemas/server/files.ts';

type Props = ModalProps & {
  onFileName: (name: string) => void;
};

export default function FileNameModal({ onFileName, opened, onClose }: Props) {
  const form = useForm<z.infer<typeof serverFilesNameSchema>>({
    initialValues: {
      name: '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverFilesNameSchema),
  });

  return (
    <Modal title='Create File' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => onFileName(form.values.name))}>
        <TextInput withAsterisk label='File Name' placeholder='File Name' {...form.getInputProps('name')} />

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()}>
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
