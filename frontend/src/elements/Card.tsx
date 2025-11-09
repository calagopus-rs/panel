import { Card, CardProps } from '@mantine/core';
import { forwardRef } from 'react';

export default forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => {
  return <Card ref={ref} className={className} withBorder {...rest} />;
});
