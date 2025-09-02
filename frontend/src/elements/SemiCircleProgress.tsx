import { forwardRef } from 'react';
import { SemiCircleProgress, SemiCircleProgressProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, SemiCircleProgressProps>(({ className, ...rest }, ref) => {
  return <SemiCircleProgress ref={ref} className={className} transitionDuration={100} {...rest} />;
});
