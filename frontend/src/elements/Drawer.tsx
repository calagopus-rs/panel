import { forwardRef } from 'react';
import { Drawer, DrawerProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, DrawerProps>(({ children, className, ...rest }, ref) => {
  return (
    <Drawer
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      ref={ref}
      className={className}
      {...rest}
    >
      {children}
    </Drawer>
  );
});
