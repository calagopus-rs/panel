import { Select as MantineSelect, SelectProps } from '@mantine/core';
import { forwardRef } from 'react';

const Select = forwardRef<HTMLInputElement, SelectProps>(({ className, allowDeselect = false, ...rest }, ref) => {
  return (
    <MantineSelect
      ref={ref}
      className={className}
      allowDeselect={allowDeselect}
      nothingFoundMessage='No results found'
      {...rest}
    />
  );
});

export default Select;
