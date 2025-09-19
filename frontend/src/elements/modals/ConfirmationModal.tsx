import React, { useState } from 'react';
import { Group, ModalProps } from '@mantine/core';
import Modal from './Modal';
import Button from '../Button';
import { load } from '@/lib/debounce';

type ConfirmationProps = Omit<ModalProps, 'children'> & {
  children: React.ReactNode;
  confirm?: string | undefined;
  onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
};

export default ({ confirm = 'Okay', children, onConfirmed, ...props }: ConfirmationProps) => {
  const [loading, setLoading] = useState(false);

  const onConfirmedAlt = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const res = onConfirmed(e);

    if (res instanceof Promise) {
      load(true, setLoading);

      Promise.resolve(res).finally(() => load(false, setLoading));
    }
  };

  return (
    <Modal {...props}>
      {children}
      <Group mt={'md'}>
        <Button color={'red'} loading={loading} onClick={onConfirmedAlt}>
          {confirm}
        </Button>
        <Button variant={'default'} onClick={props.onClose}>
          Cancel
        </Button>
      </Group>
    </Modal>
  );
};
