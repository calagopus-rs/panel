import { TagsInput as MantineTagsInput, TagsInputProps } from '@mantine/core';
import { forwardRef } from 'react';

const TagsInput = forwardRef<HTMLInputElement, TagsInputProps>(({ className, ...rest }, ref) => {
  return <MantineTagsInput ref={ref} className={className} {...rest} />;
});

export default TagsInput;
