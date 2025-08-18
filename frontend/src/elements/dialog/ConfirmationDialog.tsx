import React from 'react';
import { Group, Modal, ModalProps } from '@mantine/core';
import NewButton from '../button/NewButton';

type ConfirmationProps = Omit<ModalProps, 'children'> & {
  children: React.ReactNode;
  confirm?: string | undefined;
  onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export default ({ confirm = 'Okay', children, onConfirmed, ...props }: ConfirmationProps) => {
  return (
    <Modal {...props}>
      {children}
      <Group align={'right'} mt={'md'}>
        <NewButton variant={'default'} onClick={props.onClose}>
          Cancel
        </NewButton>
        <NewButton color={'red'} onClick={onConfirmed}>
          {confirm}
        </NewButton>
      </Group>
    </Modal>
  );
};
