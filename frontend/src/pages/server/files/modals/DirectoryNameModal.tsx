import { httpErrorToHuman } from '@/api/axios';
import createDirectory from '@/api/server/files/createDirectory';
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
import { useSearchParams } from 'react-router';

export default ({ opened, onClose }: ModalProps) => {
  const [_, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, browsingDirectory } = useServerStore();

  const [dirName, setDirName] = useState('');
  const [loading, setLoading] = useState(false);

  const makeDirectory = () => {
    load(true, setLoading);

    createDirectory(server.uuid, browsingDirectory, dirName)
      .then(() => {
        onClose();
        setSearchParams({ directory: join(browsingDirectory, dirName) });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Create Directory'} onClose={onClose} opened={opened}>
      <TextInput
        label={'Directory Name'}
        placeholder={'Directory Name'}
        value={dirName}
        onChange={(e) => setDirName(e.target.value)}
      />

      <p className={'mt-2 text-sm md:text-base break-all'}>
        <span className={'text-neutral-200'}>This directory will be created as&nbsp;</span>
        <Code>
          /home/container/
          <span className={'text-cyan-200'}>{join(browsingDirectory, dirName).replace(/^(\.\.\/|\/)+/, '')}</span>
        </Code>
      </p>

      <Group mt={'md'}>
        <Button onClick={makeDirectory} loading={loading} disabled={!dirName}>
          Create
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
