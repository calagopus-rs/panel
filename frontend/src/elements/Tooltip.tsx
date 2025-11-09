import { Tooltip, TooltipProps } from '@mantine/core';
import { forwardRef } from 'react';

export default forwardRef<HTMLDivElement, TooltipProps>(({ children, className, ...rest }, ref) => {
  return (
    <Tooltip ref={ref} className={className} {...rest}>
      <div>{children}</div>
    </Tooltip>
  );
});
