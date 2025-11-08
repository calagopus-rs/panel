import { ReactNode, useContext, useEffect } from 'react';
import { DialogContext } from './';

export default ({ children }: { children: ReactNode }) => {
  const { setFooter } = useContext(DialogContext);

  useEffect(() => {
    setFooter(
      <div className={'px-6 py-3 bg-gray-700 flex items-center justify-end space-x-3 rounded-b'}>{children}</div>,
    );
  }, [children]);

  return null;
};
