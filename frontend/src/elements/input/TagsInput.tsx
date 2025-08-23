import { forwardRef } from 'react';
import { TagsInput, TagsInputProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, TagsInputProps>(({ className, ...rest }, ref) => {
  return <TagsInput ref={ref} className={className} {...rest} />;
});
