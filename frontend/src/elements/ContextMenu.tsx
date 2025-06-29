import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ContextMenuContext = createContext(null);

export const ContextMenuProvider = ({ children }) => {
  const [state, setState] = useState({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  const menuRef = useRef(null);

  const hideMenu = () => setState(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    const handleClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        hideMenu();
      }
    };

    if (state.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.visible]);

  return (
    <ContextMenuContext.Provider value={{ state, setState, hideMenu }}>
      {children}
      {state.visible &&
        createPortal(
          <ul
            ref={menuRef}
            className="absolute z-50 bg-gray-600 border border-gray-500 shadow-md rounded w-40"
            style={{ top: state.y, left: state.x }}
          >
            {state.items.map((item, idx) => (
              <li
                key={idx}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  item.onClick();
                  hideMenu();
                }}
              >
                {item.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </ContextMenuContext.Provider>
  );
};

const ContextMenu = ({ items = [], children }) => {
  const { setState, hideMenu } = useContext(ContextMenuContext);

  const openMenu = (x, y) => {
    setState({ visible: true, x, y, items });
  };

  return children({ openMenu, hideMenu });
};

export default ContextMenu;
