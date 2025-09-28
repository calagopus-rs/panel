import React, { useState } from 'react';
import { DefaultMantineColor, Group, ModalProps } from '@mantine/core';
import Modal from './Modal';
import Button from '../Button';
import { load } from '@/lib/debounce';

type ConfirmationProps = Omit<ModalProps, 'children'> & {
  confirm?: string | undefined;
  confirmColor?: DefaultMantineColor;
  onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
  children: React.ReactNode;
};

export default ({ confirm = 'Okay', confirmColor = 'red', onConfirmed, children, ...props }: ConfirmationProps) => {
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
        <Button color={confirmColor} loading={loading} onClick={onConfirmedAlt}>
          {confirm}
        </Button>
        <Button variant={'default'} onClick={props.onClose}>
          Cancel
        </Button>
      </Group>
    </Modal>
  );
};
