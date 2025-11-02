import { forwardRef } from 'react';
import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import classNames from 'classnames';

export interface ButtonProps extends Omit<MantineButtonProps, 'onClick'> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
}

export default forwardRef<HTMLButtonElement, ButtonProps>(
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
