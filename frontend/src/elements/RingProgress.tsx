import { RingProgress as MantineRingProgress, RingProgressProps } from '@mantine/core';
import { forwardRef } from 'react';

const RingProgress = forwardRef<HTMLDivElement, RingProgressProps>(({ className, ...rest }, ref) => {
  return <MantineRingProgress ref={ref} className={className} {...rest} />;
});

export default RingProgress;
