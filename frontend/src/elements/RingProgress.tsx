import { forwardRef } from 'react';
import { RingProgress, RingProgressProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, RingProgressProps>(({ className, ...rest }, ref) => {
  return <RingProgress ref={ref} className={className} {...rest} />;
});
