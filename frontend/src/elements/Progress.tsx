import { Progress as MantineProgress, ProgressProps } from '@mantine/core';
import classNames from 'classnames';
import { forwardRef } from 'react';
import AnimatedHourglass from './AnimatedHourglass';

const Progress = forwardRef<HTMLDivElement, ProgressProps & { hourglass?: boolean }>(
  ({ value, className, hourglass = true, ...rest }, ref) => {
    return (
      <div className={classNames('flex flex-row items-center', className)}>
        {hourglass && (
          <span className='mr-2'>
            <AnimatedHourglass />
          </span>
        )}

        <MantineProgress.Root size='xl' className='flex-grow' ref={ref} {...rest}>
          <MantineProgress.Section value={value} color='blue'>
            <MantineProgress.Label>{value.toFixed(1)}%</MantineProgress.Label>
          </MantineProgress.Section>
        </MantineProgress.Root>
      </div>
    );
  },
);

export default Progress;
