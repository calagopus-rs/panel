import { TextInput as MantineTextInput, TextInputProps } from '@mantine/core';
import { forwardRef } from 'react';

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({ className, ...rest }, ref) => {
  return <MantineTextInput ref={ref} className={className} {...rest} />;
});

export default TextInput;
