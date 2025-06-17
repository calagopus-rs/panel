import { JSX, ReactNode } from 'react';

export enum Shape {
  Default,
  IconSquare,
}

export enum Size {
  Default,
  Small,
  Large,
}

export enum Variant {
  Primary,
  Secondary,
}

export enum Style {
  Blue,
  Gray,
  Red,
  Green,
}

export const Options = { Shape, Size, Variant, Style };

export type ButtonProps = JSX.IntrinsicElements['button'] & {
  children: ReactNode;
  shape?: Shape;
  size?: Size;
  variant?: Variant;
  style?: Style;
  isLoading?: boolean;
};
