import { BadgeProps, Badge as MantineBadge } from '@mantine/core';
import { forwardRef } from 'react';

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, ...rest }, ref) => {
  return <MantineBadge ref={ref} className={`${className} font-semibold!`} {...rest} />;
});

export default Badge;
