import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import classNames from 'classnames';
import { forwardRef, MouseEvent as ReactMouseEvent } from 'react';

export interface ButtonProps extends Omit<MantineButtonProps, 'onClick'> {
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => void | Promise<void>;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, type, onClick, loading, disabled, ...rest }, ref) => {
    return (
      <MantineButton
        ref={ref}
        type={type}
        className={classNames(className, loading ? 'cursor-wait!' : null, 'font-normal!')}
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
