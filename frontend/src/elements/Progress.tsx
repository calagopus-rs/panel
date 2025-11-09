import { Progress, ProgressProps } from '@mantine/core';
import classNames from 'classnames';
import { forwardRef } from 'react';
import AnimatedHourglass from './AnimatedHourglass';

export default forwardRef<HTMLDivElement, ProgressProps & { hourglass?: boolean }>(
  ({ value, className, hourglass = true, ...rest }, ref) => {
    return (
      <div className={classNames('flex flex-row items-center', className)}>
        {hourglass && (
          <span className={'mr-2'}>
            <AnimatedHourglass />
          </span>
        )}

        <Progress.Root size={'xl'} className={'flex-grow'} ref={ref} {...rest}>
          <Progress.Section value={value} color={'blue'}>
            <Progress.Label>{value.toFixed(1)}%</Progress.Label>
          </Progress.Section>
        </Progress.Root>
      </div>
    );
  },
);
