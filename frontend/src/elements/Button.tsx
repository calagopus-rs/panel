import { forwardRef } from 'react';
import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';

export interface ButtonProps extends Omit<MantineButtonProps, 'onClick'> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
}

export default forwardRef<HTMLButtonElement, ButtonProps>(({ children, className, onClick, ...rest }, ref) => {
  return (
    <MantineButton ref={ref} className={className} onClick={onClick} {...rest}>
      {children}
    </MantineButton>
  );
});
