import { FileInputProps, FileInput as MantineFileInput } from '@mantine/core';
import { forwardRef } from 'react';

const FileInput = forwardRef<HTMLButtonElement, FileInputProps>(({ className, ...rest }, ref) => {
  return <MantineFileInput ref={ref} className={className} {...rest} />;
});

export default FileInput;
