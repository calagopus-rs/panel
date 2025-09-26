import { forwardRef } from 'react';
import { FileInput, FileInputProps } from '@mantine/core';

export default forwardRef<HTMLButtonElement, FileInputProps>(({ className, ...rest }, ref) => {
  return <FileInput ref={ref} className={className} {...rest} />;
});
