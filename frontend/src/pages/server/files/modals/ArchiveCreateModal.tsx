import { httpErrorToHuman } from '@/api/axios';
import compressFiles from '@/api/server/files/compressFiles';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { archiveFormatLabelMapping } from '@/lib/enums';
import { generateArchiveName } from '@/lib/files';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps, Stack } from '@mantine/core';
import { join } from 'pathe';
import { useState } from 'react';

type Props = ModalProps & {
  files: DirectoryEntry[];
};

export default ({ files, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server, browsingDirectory } = useServerStore();

  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState<ArchiveFormat>('tar_gz');
  const [loading, setLoading] = useState(false);

  const doArchive = () => {
    load(true, setLoading);

    compressFiles(server.uuid, {
      name: fileName
        ? fileName.concat(archiveFormatLabelMapping[format])
        : generateArchiveName(archiveFormatLabelMapping[format]),
      format,
      root: browsingDirectory,
      files: files.map((f) => f.name),
    })
      .then(() => {
        addToast('Archive has been created.', 'success');
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Create Archive'} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          label={'Archive Name'}
          placeholder={'Archive Name'}
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />

        <Select
          withAsterisk
          label={'Format'}
          data={Object.entries(archiveFormatLabelMapping).map(([format, extension]) => ({
            label: extension,
            value: format,
          }))}
          value={format}
          onChange={(value) => setFormat(value as ArchiveFormat)}
        />

        <p className={'text-sm md:text-base break-all'}>
          <span className={'text-neutral-200'}>This archive will be created as&nbsp;</span>
          <Code>
            /home/container/
            <span className={'text-cyan-200'}>
              {join(
                browsingDirectory,
                fileName
                  ? `${fileName}${archiveFormatLabelMapping[format]}`
                  : generateArchiveName(archiveFormatLabelMapping[format]),
              ).replace(/^(\.\.\/|\/)+/, '')}
            </span>
          </Code>
        </p>

        <Group>
          <Button onClick={doArchive} loading={loading}>
            Create
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
