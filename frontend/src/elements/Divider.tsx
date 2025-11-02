import { forwardRef } from 'react';
import { Divider, DividerProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, DividerProps>(({ className, ...rest }, ref) => {
  return <Divider ref={ref} className={className} {...rest} />;
});
