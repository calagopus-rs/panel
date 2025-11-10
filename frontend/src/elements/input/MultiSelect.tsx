import { MultiSelect as MantineMultiSelect, MultiSelectProps } from '@mantine/core';
import { forwardRef } from 'react';

const MultiSelect = forwardRef<HTMLInputElement, MultiSelectProps>(({ className, ...rest }, ref) => {
  return <MantineMultiSelect ref={ref} className={className} nothingFoundMessage={'No results found'} {...rest} />;
});

export default MultiSelect;
