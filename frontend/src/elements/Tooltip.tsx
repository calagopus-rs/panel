import { Tooltip as MantineTooltip, TooltipProps } from '@mantine/core';
import { forwardRef } from 'react';

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(({ children, className, ...rest }, ref) => {
  return (
    <MantineTooltip ref={ref} className={className} {...rest}>
      <div>{children}</div>
    </MantineTooltip>
  );
});

export default Tooltip;
