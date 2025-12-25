import { Switch as MantineSwitch, SwitchProps } from '@mantine/core';
import { forwardRef } from 'react';

const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ className, description, ...rest }, ref) => {
  return (
    <div className='flex flex-col gap-1'>
      <MantineSwitch ref={ref} className={className} {...rest} />
      {description && <p className='text-white/40! text-xs'>{description}</p>}
    </div>
  );
});

export default Switch;
