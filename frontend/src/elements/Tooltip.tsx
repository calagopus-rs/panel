import { forwardRef } from 'react';
import { Tooltip, TooltipProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, TooltipProps>(({ children, className, ...rest }, ref) => {
  return (
    <Tooltip ref={ref} className={className} {...rest}>
      <div>{children}</div>
    </Tooltip>
  );
});
