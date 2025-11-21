import { DefaultMantineColor, Group, ModalProps } from '@mantine/core';
import { MouseEvent as ReactMouseEvent, ReactNode, useState } from 'react';
import Button from '../Button';
import Modal from './Modal';

type ConfirmationProps = Omit<ModalProps, 'children'> & {
  confirm?: string | undefined;
  confirmColor?: DefaultMantineColor;
  onConfirmed: (e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
  children: ReactNode;
};

export default function ConfirmationModal({
  confirm = 'Okay',
  confirmColor = 'red',
  onConfirmed,
  children,
  ...props
}: ConfirmationProps) {
  const [loading, setLoading] = useState(false);

  const onConfirmedAlt = (e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
    const res = onConfirmed(e);

    if (res instanceof Promise) {
      setLoading(true);

      Promise.resolve(res).finally(() => setLoading(false));
    }
  };

  return (
    <Modal {...props}>
      {children}
      <Group mt='md'>
        <Button color={confirmColor} loading={loading} onClick={onConfirmedAlt}>
          {confirm}
        </Button>
        <Button variant='default' onClick={props.onClose}>
          Cancel
        </Button>
      </Group>
    </Modal>
  );
}
