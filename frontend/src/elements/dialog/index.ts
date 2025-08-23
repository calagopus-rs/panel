import DialogComponent from './Dialog';
import DialogFooter from './DialogFooter';
import DialogIcon from './DialogIcon';

const Dialog = Object.assign(DialogComponent, {
  Footer: DialogFooter,
  Icon: DialogIcon,
});

export { Dialog };
export * from './types.d';
export * from './context';
export { default as styles } from './dialog.module.css';
