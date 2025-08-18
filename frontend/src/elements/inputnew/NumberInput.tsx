import { forwardRef } from 'react';
import { NumberInput, NumberInputProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, NumberInputProps>(({ children, className, ...rest }, ref) => {
  return (
    <NumberInput ref={ref} className={className} {...rest}>
      {children}
    </NumberInput>
  );
});
