import { CardProps, Card as MantineCard } from '@mantine/core';
import { forwardRef } from 'react';

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => {
  return <MantineCard ref={ref} className={className} withBorder {...rest} />;
});

export default Card;
