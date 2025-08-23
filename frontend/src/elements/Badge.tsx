import { forwardRef } from 'react';
import { Badge, BadgeProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, BadgeProps>(({ className, ...rest }, ref) => {
  return <Badge ref={ref} className={className} {...rest} />;
});
