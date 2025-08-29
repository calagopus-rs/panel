import { forwardRef } from 'react';
import { PinInput, PinInputProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, PinInputProps>(({ className, ...rest }, ref) => {
  return <PinInput ref={ref} className={className} {...rest} />;
});
