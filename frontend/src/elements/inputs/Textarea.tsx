import React, { forwardRef } from 'react';
import classNames from 'classnames';
import styles from './inputs.module.css';

enum Variant {
  Normal,
  Snug,
  Loose,
}

interface TextareaProps extends React.ComponentProps<'textarea'> {
  variant?: Variant;
}

const Component = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, variant, ...props }, ref) => (
  <textarea
    ref={ref}
    className={classNames(
      'form-input resize-none',
      styles.text_input,
      { [styles.loose]: variant === Variant.Loose },
      className,
    )}
    {...props}
  />
));

const Textarea = Object.assign(Component, { Variants: Variant });

export default Textarea;
