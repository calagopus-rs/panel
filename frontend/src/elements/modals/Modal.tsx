import { forwardRef } from 'react';
import { Modal, ModalProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, ModalProps>(({ children, className, ...rest }, ref) => {
  return (
    <Modal
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
    </Modal>
  );
});
