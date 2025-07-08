import { forwardRef } from 'react';
import classNames from 'classnames';

import type { ButtonProps } from '@/elements/button/types';
import { Options } from '@/elements/button/types';
import styles from './button.module.css';
import Spinner from '../Spinner';

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, shape, size, variant, style, isLoading, className, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={classNames(
          styles.button,
          styles.blue,
          {
            [styles.square]: shape === Options.Shape.IconSquare,
            [styles.small]: size === Options.Size.Small,
            [styles.large]: size === Options.Size.Large,
            [styles.secondary]: variant === Options.Variant.Secondary && !isLoading,
            [styles.gray]: style === Options.Style.Gray,
            [styles.red]: style === Options.Style.Red,
            [styles.green]: style === Options.Style.Green,
          },
          className,
        )}
        {...rest}
      >
        {isLoading && (
          <div className="flex absolute justify-center items-center w-full h-full left-0 top-0">
            <Spinner size={20} />
          </div>
        )}
        <span className={isLoading ? 'text-transparent' : undefined}>{children}</span>
      </button>
    );
  },
);

const _Button = Object.assign(Button, {
  Sizes: Options.Size,
  Shapes: Options.Shape,
  Variants: Options.Variant,
  Styles: Options.Style,
});

export default _Button;
