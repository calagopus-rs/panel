import { forwardRef } from 'react';
import { Card, CardProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => {
  return <Card ref={ref} className={className} {...rest} />;
});
