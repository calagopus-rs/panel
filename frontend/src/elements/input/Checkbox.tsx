import { forwardRef } from 'react';
import { Checkbox, CheckboxProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...rest }, ref) => {
  return <Checkbox ref={ref} className={className} {...rest} />;
});
