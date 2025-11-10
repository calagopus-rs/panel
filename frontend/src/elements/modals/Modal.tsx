import { Modal as MantineModal, ModalProps } from '@mantine/core';
import { forwardRef } from 'react';

const Modal = forwardRef<HTMLDivElement, ModalProps>(({ children, className, ...rest }, ref) => {
  return (
    <MantineModal
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      ref={ref}
      className={className}
      {...rest}
    >
      {children}
    </MantineModal>
  );
});

export default Modal;
