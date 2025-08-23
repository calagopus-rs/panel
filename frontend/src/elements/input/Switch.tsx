import { forwardRef } from 'react';
import { Switch, SwitchProps } from '@mantine/core';

export default forwardRef<HTMLInputElement, SwitchProps>(({ className, ...rest }, ref) => {
  return <Switch ref={ref} className={className} {...rest} />;
});
