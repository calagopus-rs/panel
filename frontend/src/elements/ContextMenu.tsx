import { useState, useRef, useEffect } from 'react';

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

  const handleContextMenu = event => {
    event.preventDefault();
    showMenu(event.pageX, event.pageY);
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
    <div onContextMenu={handleContextMenu} className="w-fit">
      {children({ openMenu: () => showMenu(100, 100) })}
      {visible && (
        <ul
          ref={menuRef}
          className="absolute z-50 bg-gray-600 border shadow-md rounded w-40"
          style={{ top: position.y, left: position.x }}
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
        </ul>
      )}
    </div>
  );
};
