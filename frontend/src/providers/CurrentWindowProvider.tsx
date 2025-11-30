import { createContext, FC, ReactNode, useCallback, useContext, useMemo } from 'react';

interface CurrentWindowContextType {
  id: number | null;
  getParent: () => HTMLDivElement | null;
}

const CurrentWindowContext = createContext<CurrentWindowContextType | undefined>(undefined);

export const CurrentWindowProvider: FC<{ children: ReactNode; id: number | null }> = ({ children, id }) => {
  const getParent = useCallback(() => {
    if (!id) {
      return null;
    }

    return document.getElementById(`window_${id}_card`) as HTMLDivElement;
  }, []);

  const contextValue = useMemo(
    () => ({
      id,
      getParent,
    }),
    [id, getParent],
  );

  return <CurrentWindowContext.Provider value={contextValue}>{children}</CurrentWindowContext.Provider>;
};

export const useCurrentWindow = (): CurrentWindowContextType => {
  const context = useContext(CurrentWindowContext);
  if (!context) {
    throw new Error('useWindows must be used within a WindowProvider');
  }

  return context;
};
