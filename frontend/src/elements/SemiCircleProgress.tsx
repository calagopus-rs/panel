import { SemiCircleProgress, SemiCircleProgressProps } from '@mantine/core';
import { forwardRef } from 'react';

export default forwardRef<HTMLDivElement, SemiCircleProgressProps>(({ className, ...rest }, ref) => {
  return <SemiCircleProgress ref={ref} className={className} transitionDuration={100} {...rest} />;
});
