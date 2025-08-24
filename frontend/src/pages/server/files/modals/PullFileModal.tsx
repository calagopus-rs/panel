import { httpErrorToHuman } from '@/api/axios';
import pullFile from '@/api/server/files/pullFile';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';
import { join } from 'pathe';
import { useState } from 'react';

export default ({ opened, onClose }: ModalProps) => {
  const { addToast } = useToast();
  const { server, browsingDirectory } = useServerStore();

  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const makeDirectory = () => {
    load(true, setLoading);

    pullFile(server.uuid, {
      root: browsingDirectory,
      url: url,
      name: fileName,
    })
      .then(() => {
        onClose();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Pull File'} onClose={onClose} opened={opened}>
      <TextInput label={'File URL'} placeholder={'File URL'} value={url} onChange={(e) => setUrl(e.target.value)} />
      <TextInput
        label={'File Name'}
        placeholder={'File Name'}
        className={'mt-2'}
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />

      <p className={'mt-2 text-sm md:text-base break-all'}>
        <span className={'text-neutral-200'}>This file will be created as&nbsp;</span>
        <Code>
          /home/container/
          <span className={'text-cyan-200'}>{join(browsingDirectory, fileName).replace(/^(\.\.\/|\/)+/, '')}</span>
        </Code>
      </p>

      <Group mt={'md'}>
        <Button onClick={makeDirectory} loading={loading} disabled={!url || !fileName}>
          Pull
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
