import { forwardRef } from 'react';
import { MultiSelect, MultiSelectProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, MultiSelectProps>(({ className, ...rest }, ref) => {
  return <MultiSelect ref={ref} className={className} nothingFoundMessage={'No results found'} {...rest} />;
});
