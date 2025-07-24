import { useServerStore } from '@/stores/server';
import classNames from 'classnames';
import { createSearchParams, NavLink } from 'react-router';
import { Fragment } from 'react/jsx-runtime';

export function FileBreadcrumbs({ path, browsingBackup }: { path: string; browsingBackup: ServerBackup | null }) {
  const server = useServerStore((state) => state.server);

  const splittedPath = path.split('/').filter(Boolean);
  const pathItems = splittedPath.map((item, index) => {
    return {
      name: item,
      path: splittedPath.slice(0, index + 1).join('/'),
    };
  });

  return (
    <div className={'ml-4 flex items-center text-gray-500'}>
      /<span className={'px-1 text-gray-300'}>{browsingBackup ? 'backups' : 'home'}</span>/
      <NavLink
        to={
          browsingBackup
            ? `/server/${server?.uuidShort}/files?${createSearchParams({
                directory: `/.backups/${browsingBackup.uuid}`,
              })}`
            : `/server/${server?.uuidShort}/files`
        }
        className={'px-1 text-gray-200 hover:text-gray-400'}
      >
        {browsingBackup ? browsingBackup.name : 'container'}
      </NavLink>
      /
      {pathItems.slice(browsingBackup ? 2 : 0).map((item, index) => {
        return (
          <Fragment key={index}>
            <NavLink
              to={`/server/${server?.uuidShort}/files?${createSearchParams({ directory: item.path })}`}
              className={classNames(
                'px-1 text-gray-200 hover:text-gray-400',
                index === pathItems.length - 1 && 'pointer-events-none',
              )}
            >
              {item.name}
            </NavLink>
            {index !== pathItems.length - (browsingBackup ? 3 : 1) && <span>/</span>}
          </Fragment>
        );
      })}
    </div>
  );
}
