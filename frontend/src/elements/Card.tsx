import { CardProps as MantineCardProps, Card as MantineCard } from '@mantine/core';
import classNames from 'classnames';
import { ComponentProps, forwardRef } from 'react';

export interface CardProps extends MantineCardProps {
  hoverable?: boolean;
  leftStripeClassName?: string;
}

const Card = forwardRef<HTMLDivElement, CardProps & ComponentProps<'div'>>(
  ({ className, pl, hoverable = false, leftStripeClassName, children, ...rest }, ref) => {
    return (
      <MantineCard
        ref={ref}
        className={classNames('relative', className, hoverable && 'hover:opacity-60 cursor-pointer')}
        pl={typeof pl === 'number' && leftStripeClassName ? pl + 4 : leftStripeClassName ? 20 : pl}
        radius='md'
        withBorder
        {...rest}
      >
        {leftStripeClassName && <div className={classNames('absolute left-0 h-full w-1 mr-1', leftStripeClassName)} />}
        {children}
      </MantineCard>
    );
  },
);

export default Card;
