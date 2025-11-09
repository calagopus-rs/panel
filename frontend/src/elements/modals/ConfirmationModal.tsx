import { DefaultMantineColor, Group, ModalProps } from '@mantine/core';
import { MouseEvent as ReactMouseEvent, ReactNode, useState } from 'react';
import { load } from '@/lib/debounce';
import Button from '../Button';
import Modal from './Modal';

type ConfirmationProps = Omit<ModalProps, 'children'> & {
  confirm?: string | undefined;
  confirmColor?: DefaultMantineColor;
  onConfirmed: (e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
  children: ReactNode;
};

export default ({ confirm = 'Okay', confirmColor = 'red', onConfirmed, children, ...props }: ConfirmationProps) => {
  const [loading, setLoading] = useState(false);

  const onConfirmedAlt = (e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
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
