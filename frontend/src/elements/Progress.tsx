import { Progress as MantineProgress, ProgressRootProps } from '@mantine/core';
import classNames from 'classnames';
import AnimatedHourglass from './AnimatedHourglass';

export default function Progress({
  value,
  className,
  hourglass = true,
  ...rest
}: ProgressRootProps & { value: number; hourglass?: boolean }) {
  return (
    <div className={classNames('flex flex-row items-center', className)}>
      {hourglass && (
        <span className='mr-2'>
          <AnimatedHourglass />
        </span>
      )}

      <MantineProgress.Root size='xl' className='flex-grow' {...rest}>
        <MantineProgress.Section value={value} color='blue'>
          <MantineProgress.Label>{value.toFixed(1)}%</MantineProgress.Label>
        </MantineProgress.Section>
      </MantineProgress.Root>
    </div>
  );
}
