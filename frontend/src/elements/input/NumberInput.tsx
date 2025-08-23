import { forwardRef } from 'react';
import { NumberInput, NumberInputProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, NumberInputProps>(({ className, ...rest }, ref) => {
  return <NumberInput ref={ref} className={className} {...rest} />;
});
