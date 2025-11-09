import { Badge, BadgeProps } from '@mantine/core';
import { forwardRef } from 'react';

export default forwardRef<HTMLDivElement, BadgeProps>(({ className, ...rest }, ref) => {
  return <Badge ref={ref} className={className} {...rest} />;
});
