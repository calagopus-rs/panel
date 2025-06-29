import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

const ContextMenuContext = createContext(null);

export const ContextMenuProvider = ({ children }) => {
  const [state, setState] = useState({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  const [shouldRender, setShouldRender] = useState(false);
  const menuRef = useRef(null);

  const showMenu = (x, y, items) => {
    setState({ visible: true, x, y, items });
    setShouldRender(true);
  };

  const hideMenu = () => {
    setState(prev => ({ ...prev, visible: false }));
  };

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
    <ContextMenuContext.Provider value={{ state, showMenu, hideMenu }}>
      {children}
      {shouldRender &&
        createPortal(
          <AnimatePresence
            onExitComplete={() => {
              setShouldRender(false);
            }}
          >
            {state.visible && (
              <motion.ul
                ref={menuRef}
                className="absolute z-50 bg-gray-600 border border-gray-500 shadow-md rounded w-40"
                style={{ top: state.y, left: state.x }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.07 }}
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
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </ContextMenuContext.Provider>
  );
};

const ContextMenu = ({ items = [], children }) => {
  const { showMenu, hideMenu } = useContext(ContextMenuContext);

  const openMenu = (x, y) => {
    showMenu(x, y, items);
  };

  return children({ openMenu, hideMenu });
};

export default ContextMenu;
