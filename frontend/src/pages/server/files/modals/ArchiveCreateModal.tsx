import { httpErrorToHuman } from '@/api/axios';
import compressFiles from '@/api/server/files/compressFiles';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Select from '@/elements/input/Select';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { archiveFormatExtensionMapping, generateArchiveName } from '@/lib/files';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';
import { join } from 'pathe';
import { useState } from 'react';

type Props = ModalProps & {
  files: DirectoryEntry[];
};

export default ({ files, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server, browsingDirectory, addBrowsingEntry } = useServerStore();

  const [fileName, setFileName] = useState('');
  const [format, setFormat] = useState<ArchiveFormat>('tar_gz');

  const doArchive = () => {
    compressFiles(server.uuid, {
      name: fileName,
      format,
      root: browsingDirectory,
      files: files.map((f) => f.name),
    })
      .then((entry) => {
        addToast('Archive has been created.', 'success');
        onClose();
        addBrowsingEntry(entry);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Modal title={'Create Archive'} onClose={onClose} opened={opened}>
      <TextInput
        label={'Archive Name'}
        placeholder={'Archive Name'}
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />

      <Select
        label={'Format'}
        data={Object.entries(archiveFormatExtensionMapping).map(([format, extension]) => ({
          label: extension,
          value: format,
        }))}
        value={format}
        onChange={(value) => setFormat(value as ArchiveFormat)}
        mt={'sm'}
      />

      <p className={'mt-2 text-sm md:text-base break-all'}>
        <span className={'text-neutral-200'}>This archive will be created as&nbsp;</span>
        <Code>
          /home/container/
          <span className={'text-cyan-200'}>
            {join(
              browsingDirectory,
              fileName
                ? `${fileName}${archiveFormatExtensionMapping[format]}`
                : generateArchiveName(archiveFormatExtensionMapping[format]),
            ).replace(/^(\.\.\/|\/)+/, '')}
          </span>
        </Code>
      </p>

      <Group mt={'md'}>
        <Button onClick={doArchive} disabled={!fileName}>
          Create
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
