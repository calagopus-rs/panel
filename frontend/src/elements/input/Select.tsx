import { forwardRef } from 'react';
import { Select, SelectProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, SelectProps>(({ className, allowDeselect = false, ...rest }, ref) => {
  return <Select ref={ref} className={className} allowDeselect={allowDeselect} {...rest} />;
});
