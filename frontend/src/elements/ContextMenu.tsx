import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Menu } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface Item {
  icon: IconDefinition;
  label: string;
  hidden?: boolean;
  disabled?: boolean;
  onClick: () => void;
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

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  const showMenu = (x: number, y: number, items: Item[]) => {
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
              item.items?.length > 0 ? (
                <Menu.Sub key={idx}>
                  <Menu.Sub.Target>
                    <Menu.Sub.Item
                      key={idx}
                      leftSection={<FontAwesomeIcon icon={item.icon} />}
                      color={item.color === 'red' ? 'red' : undefined}
                      disabled={item.disabled}
                      onClick={(e) => {
                        if (!e.isTrusted) return;

                        item.onClick();
                        hideMenu();
                      }}
                    >
                      {item.label}
                    </Menu.Sub.Item>
                  </Menu.Sub.Target>

                  <Menu.Sub.Dropdown>
                    {item.items.map((subItem, subIdx) => (
                      <Menu.Item
                        key={idx.toString() + subIdx.toString()}
                        leftSection={<FontAwesomeIcon icon={subItem.icon} />}
                        color={subItem.color === 'red' ? 'red' : undefined}
                        disabled={subItem.disabled}
                        onClick={(e) => {
                          if (!e.isTrusted) return;

                          subItem.onClick();
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

                    item.onClick();
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
