import { MouseEvent as ReactMouseEvent, ReactNode, useRef, useState } from 'react';
import {
  Dialog as HDialog,
  DialogPanel as HDialogPanel,
  DialogTitle as HDialogTitle,
  Description as HDescription,
} from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, Easing, motion } from 'motion/react';
import { DialogContext, IconPosition, RenderDialogProps, styles } from './';
import { Button } from '../button';

const variants = {
  open: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: 'easeInOut' as Easing,
    },
  },
  closed: {
    scale: 0.75,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
  bounce: {
    scale: 0.95,
    opacity: 1,
    transition: {
      duration: 0.075,
      ease: 'easeInOut' as Easing,
    },
  },
};

export default ({
  open,
  title,
  description,
  onClose,
  hideCloseIcon,
  preventExternalClose,
  children,
}: RenderDialogProps) => {
  const container = useRef<HTMLDivElement>(null);
  const [icon, setIcon] = useState<ReactNode>();
  const [footer, setFooter] = useState<ReactNode>();
  const [iconPosition, setIconPosition] = useState<IconPosition>('title');
  const [down, setDown] = useState(false);

  const onContainerClick = (down: boolean, e: ReactMouseEvent<HTMLDivElement>): void => {
    if (e.target instanceof HTMLElement && container.current?.isSameNode(e.target)) {
      setDown(down);
    }
  };

  const onDialogClose = (): void => {
    if (!preventExternalClose) {
      return onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <DialogContext.Provider value={{ setIcon, setFooter, setIconPosition }}>
          <HDialog static open={open} onClose={onDialogClose}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30"
            />
            <div className={'fixed inset-0 z-40 bg-slate-900/50'} />
            <div className={'fixed inset-0 z-50 overflow-y-auto'}>
              <div
                ref={container}
                className={styles.container}
                onMouseDown={onContainerClick.bind(this, true)}
                onMouseUp={onContainerClick.bind(this, false)}
              >
                <HDialogPanel
                  as={motion.div}
                  initial={'closed'}
                  animate={down ? 'bounce' : 'open'}
                  exit={'closed'}
                  variants={variants}
                  className={styles.panel}
                >
                  <div className={'flex overflow-y-auto p-6 pb-0'}>
                    {iconPosition === 'container' && icon}
                    <div className={'max-h-[70vh] min-w-0 flex-1'}>
                      <div className={'flex items-center'}>
                        {iconPosition !== 'container' && icon}
                        <div>
                          {title && <HDialogTitle className={styles.title}>{title}</HDialogTitle>}
                          {description && <HDescription>{description}</HDescription>}
                        </div>
                      </div>
                      {children}
                      <div className={'invisible h-6'} />
                    </div>
                  </div>
                  {footer}
                  {/* Keep this below the other buttons so that it isn't the default focus if they're present. */}
                  {!hideCloseIcon && (
                    <div className={'absolute right-0 top-0 m-4'}>
                      <Button
                        size={Button.Sizes.Small}
                        shape={Button.Shapes.IconSquare}
                        style={Button.Styles.Gray}
                        onClick={onClose}
                        className={'group'}
                      >
                        <XMarkIcon className={styles.close_icon} />
                      </Button>
                    </div>
                  )}
                </HDialogPanel>
              </div>
            </div>
          </HDialog>
        </DialogContext.Provider>
      )}
    </AnimatePresence>
  );
};
