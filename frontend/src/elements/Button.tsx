import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import classNames from 'classnames';
import { forwardRef, MouseEvent as ReactMouseEvent } from 'react';

export interface ButtonProps extends Omit<MantineButtonProps, 'onClick'> {
  onClick?: (event: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, onClick, loading, disabled, ...rest }, ref) => {
    return (
      <MantineButton
        ref={ref}
        className={classNames(className, loading ? 'cursor-wait!' : null)}
        onClick={onClick}
        loading={disabled ? false : loading}
        disabled={disabled}
        {...rest}
      >
        {children}
      </MantineButton>
    );
  },
);

export default Button;
