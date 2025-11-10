import { NumberInput as MantineNumberInput, NumberInputProps } from '@mantine/core';
import { forwardRef } from 'react';

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({ className, ...rest }, ref) => {
  return <MantineNumberInput ref={ref} className={className} {...rest} />;
});

export default NumberInput;
