import { forwardRef } from 'react';
import { Progress, ProgressProps } from '@mantine/core';
import AnimatedHourglass from './AnimatedHourglass';

export default forwardRef<HTMLDivElement, ProgressProps>(({ value, ...rest }, ref) => {
  return (
    <div className={'flex flex-row items-center'}>
      <span className={'mr-2'}>
        <AnimatedHourglass />
      </span>

      <Progress.Root size={'xl'} className={'flex-grow'} ref={ref} {...rest}>
        <Progress.Section value={value} color={'blue'}>
          <Progress.Label>{value.toFixed(1)}%</Progress.Label>
        </Progress.Section>
      </Progress.Root>
    </div>
  );
});
