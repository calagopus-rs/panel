import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { join } from 'pathe';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import compressFiles from '@/api/server/files/compressFiles';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { archiveFormatLabelMapping } from '@/lib/enums';
import { generateArchiveName } from '@/lib/files';
import { serverFilesArchiveCreateSchema } from '@/lib/schemas/server/files';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

type Props = ModalProps & {
  files: DirectoryEntry[];
};

export default function ArchiveCreateModal({ files, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { server, browsingDirectory } = useServerStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverFilesArchiveCreateSchema>>({
    initialValues: {
      name: '',
      format: 'tar_gz',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverFilesArchiveCreateSchema),
  });

  const doArchive = () => {
    setLoading(true);

    compressFiles(server.uuid, {
      name: form.values.name
        ? form.values.name.concat(archiveFormatLabelMapping[form.values.format as ArchiveFormat])
        : generateArchiveName(archiveFormatLabelMapping[form.values.format as ArchiveFormat]),
      format: form.values.format,
      root: browsingDirectory!,
      files: files.map((f) => f.name),
    })
      .then(() => {
        addToast('Archive has been created.', 'success');
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Create Archive' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => doArchive())}>
        <Stack>
          <TextInput label='Archive Name' placeholder='Archive Name' {...form.getInputProps('name')} />

          <Select
            withAsterisk
            label='Format'
            data={Object.entries(archiveFormatLabelMapping).map(([format, extension]) => ({
              label: extension,
              value: format,
            }))}
            {...form.getInputProps('format')}
          />

          <p className='text-sm md:text-base break-all'>
            <span className='text-neutral-200'>This archive will be created as&nbsp;</span>
            <Code>
              /home/container/
              <span className='text-cyan-200'>
                {join(
                  browsingDirectory!,
                  form.values.name
                    ? `${form.values.name}${archiveFormatLabelMapping[form.values.format as ArchiveFormat]}`
                    : generateArchiveName(archiveFormatLabelMapping[form.values.format as ArchiveFormat]),
                ).replace(/^(\.\.\/|\/)+/, '')}
              </span>
            </Code>
          </p>

          <Group>
            <Button type='submit' loading={loading}>
              Create
            </Button>
            <Button variant='default' onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
