import { Tooltip as MantineTooltip, TooltipProps } from '@mantine/core';
import classNames from 'classnames';
import { forwardRef } from 'react';

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(({ children, className, ...rest }, ref) => {
  return (
    <MantineTooltip ref={ref} className={classNames(className, 'w-fit')} {...rest}>
      <div>{children}</div>
    </MantineTooltip>
  );
});

export default Tooltip;
