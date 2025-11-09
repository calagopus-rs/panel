import { Notification, NotificationProps } from '@mantine/core';
import { forwardRef } from 'react';

export default forwardRef<HTMLDivElement, NotificationProps>(({ className, ...rest }, ref) => {
  return <Notification ref={ref} className={className} radius={'md'} withCloseButton={false} {...rest} />;
});
