import { Tooltip, TooltipProps as MantineTooltipProps } from '@mantine/core';
import { forwardRef } from 'react';

export interface TooltipProps extends MantineTooltipProps {
  enabled: boolean;
}

export default forwardRef<HTMLDivElement, TooltipProps>(({ children, className, enabled, ...rest }, ref) => {
  return enabled ? (
    <Tooltip ref={ref} className={className} {...rest}>
      <div>{children}</div>
    </Tooltip>
  ) : (
    <div>{children}</div>
  );
});
