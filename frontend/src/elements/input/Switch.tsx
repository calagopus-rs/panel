import { Switch as MantineSwitch, SwitchProps } from '@mantine/core';
import { forwardRef } from 'react';

const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ className, ...rest }, ref) => {
  return <MantineSwitch ref={ref} className={className} {...rest} />;
});

export default Switch;
