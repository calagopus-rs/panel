import { RingProgress, RingProgressProps } from '@mantine/core';
import { forwardRef } from 'react';

export default forwardRef<HTMLDivElement, RingProgressProps>(({ className, ...rest }, ref) => {
  return <RingProgress ref={ref} className={className} {...rest} />;
});
