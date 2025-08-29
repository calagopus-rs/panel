import { forwardRef } from 'react';
import { PasswordInput, PasswordInputProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, PasswordInputProps>(({ className, ...rest }, ref) => {
  return <PasswordInput ref={ref} className={className} {...rest} />;
});
