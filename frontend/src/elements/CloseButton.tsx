import { forwardRef } from 'react';
import { CloseButton as MantineCloseButton, CloseButtonProps as MantineCloseButtonProps } from '@mantine/core';

export interface ButtonProps extends Omit<MantineCloseButtonProps, 'onClick'> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
}

export default forwardRef<HTMLButtonElement, ButtonProps>(({ children, className, onClick, ...rest }, ref) => {
  return (
    <MantineCloseButton ref={ref} className={className} onClick={onClick} {...rest}>
      {children}
    </MantineCloseButton>
  );
});
