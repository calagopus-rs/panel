import { forwardRef } from 'react';
import { Progress, ProgressProps } from '@mantine/core';

export default forwardRef<HTMLDivElement, ProgressProps>(({ value, ...rest }, ref) => {
  return (
    <Progress.Root size={'xl'} ref={ref} {...rest}>
      <Progress.Section value={value} color={'blue'}>
        <Progress.Label>{value.toFixed(1)}%</Progress.Label>
      </Progress.Section>
    </Progress.Root>
  );
});
