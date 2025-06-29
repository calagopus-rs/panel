import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default ({ items = [], children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  const showMenu = (x, y) => {
    setPosition({ x, y });
    setVisible(true);
  };

  const hideMenu = () => {
    setVisible(false);
  };

  const handleClickOutside = event => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      hideMenu();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <>
      {children({
        openMenu: (x, y) => showMenu(x, y),
        hideMenu,
      })}

      {visible &&
        createPortal(
          <ul
            ref={menuRef}
            className="absolute z-50 bg-gray-600 border border-gray-500 shadow-md rounded w-40"
            style={{ top: position.y, left: position.x, position: 'absolute' }}
          >
            {items.map((item, idx) => (
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
    </>
  );
};
