import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Menu } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface Item {
  icon: IconDefinition;
  label: string;
  hidden?: boolean;
  onClick: () => void;
  color?: 'gray' | 'red';
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: Item[];
}

interface ContextMenuContextType {
  state: ContextMenuState;
  showMenu: (x: number, y: number, items: Item[]) => void;
  hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  const menuRef = useRef<HTMLDivElement | null>(null);

  const showMenu = (x: number, y: number, items: Item[]) => {
    const menuWidth = 200; // same as Menu width
    const menuHeight = items.length * 36; // ~36px per item (Mantine default)

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > viewportWidth) {
      adjustedX = viewportWidth - menuWidth - 8; // 8px margin
    }
    if (y + menuHeight > viewportHeight) {
      adjustedY = viewportHeight - menuHeight - 8;
    }

    setState({ visible: true, x: adjustedX, y: adjustedY, items });
  };

  const hideMenu = () => {
    setState((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideMenu();
      }
    };

    if (state.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.visible]);

  return (
    <ContextMenuContext.Provider value={{ state, showMenu, hideMenu }}>
      {children}

      <div ref={menuRef}>
        <Menu
          opened={state.visible}
          onClose={hideMenu}
          width={200}
          withinPortal={true}
          transitionProps={{ transition: 'scale-y', duration: 200 }}
          styles={{
            dropdown: {
              position: 'absolute',
              top: state.y,
              left: state.x,
              zIndex: 999,
            },
          }}
        >
          <Menu.Dropdown>
            {state.items
              .filter((item) => !item.hidden)
              .map((item, idx) => (
                <Menu.Item
                  key={idx}
                  leftSection={<FontAwesomeIcon icon={item.icon} />}
                  color={item.color === 'red' ? 'red' : undefined}
                  onClick={() => {
                    item.onClick();
                    hideMenu();
                  }}
                >
                  {item.label}
                </Menu.Item>
              ))}
          </Menu.Dropdown>
        </Menu>
      </div>
    </ContextMenuContext.Provider>
  );
};

const ContextMenu = ({
  items = [],
  children,
}: {
  items: Item[];
  children: (ctx: { openMenu: (x: number, y: number) => void; hideMenu: () => void }) => ReactNode;
}) => {
  const { showMenu, hideMenu } = useContext(ContextMenuContext);

  const openMenu = (x: number, y: number) => {
    showMenu(
      x,
      y,
      items.filter((item) => item), // Filter null values
    );
  };

  return children({ openMenu, hideMenu });
};

ContextMenu.Toggle = ({ openMenu }: { openMenu: (x: number, y: number) => void }) => {
  return (
    <td
      className={'relative cursor-pointer w-10 text-center'}
      onClick={(e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        openMenu(rect.left, rect.bottom);
      }}
    >
      <FontAwesomeIcon icon={faEllipsis} />
    </td>
  );
};

export default ContextMenu;
