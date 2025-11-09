import { Dispatch, ReactNode, SetStateAction } from 'react';

type Callback<T> = ((value: T) => void) | Dispatch<SetStateAction<T>>;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
}

export type IconPosition = 'title' | 'container' | undefined;

export interface DialogIconProps {
  type: 'danger' | 'info' | 'success' | 'warning';
  position?: IconPosition;
  className?: string;
}

export interface RenderDialogProps extends DialogProps {
  hideCloseIcon?: boolean;
  preventExternalClose?: boolean;
  title?: string;
  description?: string | undefined;
  children?: ReactNode;
}

export type WrapperProps = Omit<RenderDialogProps, 'children' | 'open' | 'onClose'>;

export interface DialogWrapperContextType {
  props: Readonly<WrapperProps>;
  setProps: Dispatch<SetStateAction<WrapperProps>>;
  close: () => void;
}

export interface DialogContextType {
  setIcon: Callback<ReactNode>;
  setFooter: Callback<ReactNode>;
  setIconPosition: Callback<IconPosition>;
}
