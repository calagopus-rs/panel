import { forwardRef } from 'react';
import { Textarea, TextareaProps } from '@mantine/core';

export default forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...rest }, ref) => {
  return <Textarea ref={ref} className={className} {...rest} />;
});
