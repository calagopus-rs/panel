import { useCurrentWindow } from '@/providers/CurrentWindowProvider';
import { faEllipsis, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Menu, MenuProps } from '@mantine/core';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface Item {
  icon: IconDefinition;
  label: string;
  hidden?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  color?: 'gray' | 'red';
  items?: Omit<Item, 'items'>[];
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

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const ContextMenuProvider = ({ children, menuProps }: { children: ReactNode; menuProps?: MenuProps }) => {
  const { getParent } = useCurrentWindow();

  const [state, setState] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  const showMenu = (x: number, y: number, items: Item[]) => {
    const windowContainer = getParent();
    if (windowContainer) {
      const windowRect = windowContainer.getBoundingClientRect();

      x = windowRect ? x - windowRect.left : x;
      y = windowRect ? y - windowRect.top : y;
    }

    setState({ visible: true, x, y, items });
  };

  const hideMenu = () => {
    setState((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const handleScroll = () => {
      hideMenu();
    };

    if (state.visible) {
      document.addEventListener('scroll', handleScroll);
    }

    return () => document.removeEventListener('scroll', handleScroll);
  }, [state.visible]);

  return (
    <ContextMenuContext.Provider value={{ state, showMenu, hideMenu }}>
      <Menu
        opened={state.visible}
        onClose={hideMenu}
        width={200}
        withinPortal
        closeOnClickOutside
        transitionProps={{ transition: 'scale-y', duration: 200 }}
        {...menuProps}
      >
        <Menu.Target>
          <div
            style={{
              position: 'fixed',
              top: state.y,
              left: state.x,
              width: 1,
              height: 1,
              pointerEvents: 'none',
            }}
          />
        </Menu.Target>

        {children}

        <Menu.Dropdown>
          {state.items
            .filter((item) => !item.hidden)
            .map((item, idx) =>
              (item.items || []).length > 0 ? (
                <Menu.Sub key={idx} position={state.x + 300 > window.innerWidth ? 'left-start' : 'right-start'}>
                  <Menu.Sub.Target>
                    <Menu.Sub.Item
                      key={idx}
                      leftSection={<FontAwesomeIcon icon={item.icon} />}
                      color={item.color === 'red' ? 'red' : undefined}
                      disabled={item.disabled}
                      onClick={(e) => {
                        if (!e.isTrusted) return;

                        if (item.onClick) {
                          item.onClick();
                        }
                        hideMenu();
                      }}
                    >
                      {item.label}
                    </Menu.Sub.Item>
                  </Menu.Sub.Target>

                  <Menu.Sub.Dropdown>
                    {item.items!.map((subItem, subIdx) => (
                      <Menu.Item
                        key={idx.toString() + subIdx.toString()}
                        leftSection={<FontAwesomeIcon icon={subItem.icon} />}
                        color={subItem.color === 'red' ? 'red' : undefined}
                        disabled={subItem.disabled}
                        onClick={(e) => {
                          if (!e.isTrusted) return;

                          subItem.onClick?.();
                          hideMenu();
                        }}
                      >
                        {subItem.label}
                      </Menu.Item>
                    ))}
                  </Menu.Sub.Dropdown>
                </Menu.Sub>
              ) : (
                <Menu.Item
                  key={idx}
                  leftSection={<FontAwesomeIcon icon={item.icon} />}
                  color={item.color === 'red' ? 'red' : undefined}
                  disabled={item.disabled}
                  onClick={(e) => {
                    if (!e.isTrusted) return;

                    if (item.onClick) {
                      item.onClick();
                    }
                    hideMenu();
                  }}
                >
                  {item.label}
                </Menu.Item>
              ),
            )}
        </Menu.Dropdown>
      </Menu>
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
  const context = useContext(ContextMenuContext);

  if (!context) {
    throw new Error('ContextMenu must be used within a ContextMenuProvider');
  }

  const { showMenu, hideMenu } = context;

  const openMenu = (x: number, y: number) => {
    showMenu(
      x,
      y,
      items.filter((item) => item),
    );
  };

  return children({ openMenu, hideMenu });
};

ContextMenu.Toggle = ({ openMenu }: { openMenu: (x: number, y: number) => void }) => {
  return (
    <td
      className='relative cursor-pointer w-10 text-center'
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
