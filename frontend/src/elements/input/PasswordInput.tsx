import { PasswordInput as MantinePasswordInput, PasswordInputProps } from '@mantine/core';
import { forwardRef } from 'react';

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ className, ...rest }, ref) => {
  return <MantinePasswordInput ref={ref} className={className} {...rest} />;
});

export default PasswordInput;
