import { PinInput as MantinePinInput, PinInputProps } from '@mantine/core';
import { forwardRef } from 'react';

const PinInput = forwardRef<HTMLInputElement, PinInputProps>(({ className, ...rest }, ref) => {
  return <MantinePinInput ref={ref} className={className} {...rest} />;
});

export default PinInput;
