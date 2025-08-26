import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  onFileName: (name: string) => void;
};

export default ({ onFileName, opened, onClose }: Props) => {
  const [fileName, setFileName] = useState('');

  return (
    <Modal title={'Create File'} onClose={onClose} opened={opened}>
      <TextInput
        withAsterisk
        label={'File Name'}
        placeholder={'File Name'}
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
      />

      <Group mt={'md'}>
        <Button onClick={() => onFileName(fileName)} disabled={!fileName}>
          Create
        </Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
