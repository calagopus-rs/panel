import { DividerProps, Divider as MantineDivider } from '@mantine/core';
import { forwardRef } from 'react';

const Divider = forwardRef<HTMLDivElement, DividerProps>(({ className, ...rest }, ref) => {
  return <MantineDivider ref={ref} className={className} {...rest} />;
});

export default Divider;
