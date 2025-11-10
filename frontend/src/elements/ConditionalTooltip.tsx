import { TooltipProps as MantineTooltipProps, Tooltip } from '@mantine/core';
import { forwardRef } from 'react';

export interface TooltipProps extends MantineTooltipProps {
  enabled: boolean;
}

const ConditionalTooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, className, enabled, ...rest }, ref) => {
    return enabled ? (
      <Tooltip ref={ref} className={className} {...rest}>
        <div>{children}</div>
      </Tooltip>
    ) : (
      <div>{children}</div>
    );
  },
);

export default ConditionalTooltip;
