import { Code, CodeProps } from '@mantine/core';
import { forwardRef } from 'react';

export default forwardRef<HTMLPreElement, CodeProps>(({ children, className, ...rest }, ref) => {
  return (
    <Code ref={ref} className={className} {...rest}>
      {children}
    </Code>
  );
});
