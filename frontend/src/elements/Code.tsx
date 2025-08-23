import { forwardRef } from 'react';
import { Code, CodeProps } from '@mantine/core';

export default forwardRef<HTMLPreElement, CodeProps>(({ children, className, ...rest }, ref) => {
  return (
    <Code ref={ref} className={className} {...rest}>
      {children}
    </Code>
  );
});
