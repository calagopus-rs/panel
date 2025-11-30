import Card from '@/elements/Card';
import { faX, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Title } from '@mantine/core';
import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Rnd } from 'react-rnd';

interface WindowType {
  id: number;
  icon?: IconDefinition;
  title: string;
  component: ReactNode;
  zIndex: number;
}

interface WindowContextType {
  addWindow: (icon: IconDefinition | null, title: string, component: ReactNode) => number;
  closeWindow: (id: number) => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

let windowId = 0;

export const WindowProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowType[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(100);

  const closeWindow = useCallback((id: number) => {
    setWindows((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addWindow = useCallback(
    (icon: IconDefinition | null, title: string, component: ReactNode) => {
      const id = windowId++;
      setMaxZIndex((prev) => prev + 1);
      setWindows((prev) => [...prev, { id, icon, title, component, zIndex: maxZIndex + 1 }]);

      return id;
    },
    [maxZIndex],
  );

  const bringToFront = useCallback(
    (id: number) => {
      setWindows((prev) => {
        const window = prev.find((w) => w.id === id);
        if (!window) return prev;

        // Check if already on top
        const isOnTop = prev.every((w) => w.id === id || w.zIndex < window.zIndex);
        if (isOnTop) return prev;

        // Bring to front
        const newZIndex = maxZIndex + 1;
        setMaxZIndex(newZIndex);

        return prev.map((w) => (w.id === id ? { ...w, zIndex: newZIndex } : w));
      });
    },
    [maxZIndex],
  );

  const contextValue = useMemo(
    () => ({
      addWindow,
      closeWindow,
    }),
    [addWindow, closeWindow],
  );

  return (
    <WindowContext.Provider value={contextValue}>
      {children}
      {windows.map((w) => (
        <Rnd
          key={`window_${w.id}`}
          default={{
            x: window.innerWidth / 4,
            y: window.innerHeight / 4,
            width: window.innerWidth / 2,
            height: window.innerHeight / 2,
          }}
          minWidth={window.innerWidth / 4}
          minHeight={window.innerHeight / 8}
          bounds='body'
          dragHandleClassName={`window_${w.id}_drag`}
          style={{ zIndex: w.zIndex }}
          onMouseDown={() => bringToFront(w.id)}
          enableResizing={{
            left: true,
            right: true,
            top: true,
            bottom: true,
            bottomLeft: true,
            bottomRight: true,
            topLeft: true,
            topRight: true,
          }}
        >
          <Card p='sm' shadow='xl' className='h-full'>
            <div className={`window_${w.id}_drag flex flex-row justify-between items-center cursor-grab`}>
              <Title order={3}>
                {w.icon && <FontAwesomeIcon icon={w.icon} />} {w.title}
              </Title>
              <div className='flex flex-row'>
                <ActionIcon
                  variant='subtle'
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWindow(w.id);
                  }}
                >
                  <FontAwesomeIcon icon={faX} />
                </ActionIcon>
              </div>
            </div>
            {w.component}
          </Card>
        </Rnd>
      ))}
    </WindowContext.Provider>
  );
};

export const useWindows = (): WindowContextType => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('useWindows must be used within a WindowProvider');
  }

  return context;
};
