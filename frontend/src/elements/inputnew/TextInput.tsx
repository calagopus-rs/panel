import { forwardRef } from 'react';
import { TextInput, TextInputProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, TextInputProps>(({ children, className, ...rest }, ref) => {
  return (
    <TextInput ref={ref} className={className} {...rest}>
      {children}
    </TextInput>
  );
});
