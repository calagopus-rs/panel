import React from 'react';
import { Group, ModalProps } from '@mantine/core';
import Modal from './Modal';
import Button from '../Button';

type ConfirmationProps = Omit<ModalProps, 'children'> & {
  children: React.ReactNode;
  confirm?: string | undefined;
  onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export default ({ confirm = 'Okay', children, onConfirmed, ...props }: ConfirmationProps) => {
  return (
    <Modal {...props}>
      {children}
      <Group mt={'md'}>
        <Button color={'red'} onClick={onConfirmed}>
          {confirm}
        </Button>
        <Button variant={'default'} onClick={props.onClose}>
          Cancel
        </Button>
      </Group>
    </Modal>
  );
};
