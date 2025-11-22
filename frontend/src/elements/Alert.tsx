import { AlertProps, Alert as MantineAlert } from '@mantine/core';
import classNames from 'classnames';
import { forwardRef } from 'react';

const Alert = forwardRef<HTMLDivElement, AlertProps>(({ className, styles, ...rest }, ref) => {
  return (
    <MantineAlert
      ref={ref}
      className={classNames(className, 'text-2xl')}
      styles={{ ...styles, wrapper: { width: '100%' }, icon: { alignSelf: 'center' } }}
      {...rest}
    />
  );
});

export default Alert;
