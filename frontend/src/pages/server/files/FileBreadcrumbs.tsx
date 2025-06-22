import { useServerStore } from '@/stores/server';
import classNames from 'classnames';
import { NavLink } from 'react-router';
import { Fragment } from 'react/jsx-runtime';

export function FileBreadcrumbs() {
  const server = useServerStore(state => state.data);
  const { directory } = useServerStore(state => state.files);

  const path = directory.split('/').filter(Boolean);
  const pathItems = path.map((item, index) => {
    return {
      name: item,
      path: path.slice(0, index + 1).join('/'),
    };
  });

  return (
    <div className="ml-4 flex items-center text-gray-500">
      /<span className="px-1 text-gray-300">home</span>/
      <NavLink to={`/server/${server?.id}/files`} className="px-1 text-gray-200 hover:text-gray-400">
        container
      </NavLink>
      /
      {pathItems.map((item, index) => {
        return (
          <Fragment key={index}>
            <NavLink
              to={`/server/${server?.id}/files/directory/${item.path}`}
              className={classNames(
                'px-1 text-gray-200 hover:text-gray-400',
                index === pathItems.length - 1 && 'pointer-events-none',
              )}
            >
              {item.name}
            </NavLink>
            {index !== pathItems.length - 1 && <span>/</span>}
          </Fragment>
        );
      })}
    </div>
  );
}
