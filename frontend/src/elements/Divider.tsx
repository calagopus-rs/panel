import { Divider, DividerProps } from '@mantine/core';
import { forwardRef } from 'react';

export default forwardRef<HTMLDivElement, DividerProps>(({ className, ...rest }, ref) => {
  return <Divider ref={ref} className={className} {...rest} />;
});
