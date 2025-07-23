import debounce from 'debounce';
import React, { useCallback, useState } from 'react';
import Spinner from '@/elements/Spinner';
import classNames from 'classnames';
import { Input } from '../inputs';
import Checkbox from '../inputs/Checkbox';
import { Button } from '../button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleLeft, faAngleDoubleRight, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';

export interface TableHooks<T> {
  page: number;
  setPage: (page: ((p: number) => number) | number) => void;

  filters: T | null;
  setFilters: (filters: ((f: T | null) => T | null) | T | null) => void;

  sort: string | null;
  setSort: (sort: string | null) => void;

  sortDirection: boolean;
  setSortDirection: (direction: ((p: boolean) => boolean) | boolean) => void;
}

export function useTableHooks<T>(initialState?: T | (() => T)): TableHooks<T> {
  const [page, setPage] = useState<number>(1);
  const [filters, setFilters] = useState<T | null>(initialState || null);
  const [sort, setSortState] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<boolean>(false);

  const setSort = (newSort: string | null) => {
    if (sort === newSort) {
      setSortDirection(!sortDirection);
    } else {
      setSortState(newSort);
      setSortDirection(false);
    }
  };

  return { page, setPage, filters, setFilters, sort, setSort, sortDirection, setSortDirection };
}

export const TableHeader = ({
  name,
  onClick,
  direction,
}: {
  name?: string;
  onClick?: (e: React.MouseEvent) => void;
  direction?: number | null;
}) => {
  if (!name) {
    return <th className={'py-2'} />;
  }

  return (
    <th className={'px-6 py-2'} onClick={onClick}>
      <span className={'flex flex-row items-center cursor-pointer'}>
        <span className={'text-xs font-medium tracking-wider uppercase text-gray-300 whitespace-nowrap select-none'}>
          {name}
        </span>

        {direction !== undefined ? (
          <div className={'ml-1'}>
            <svg fill={'none'} viewBox={'0 0 20 20'} className={'w-4 h-4 text-gray-400'}>
              {direction === null || direction === 1 ? (
                <path
                  stroke={'currentColor'}
                  strokeWidth={'2'}
                  strokeLinecap={'round'}
                  strokeLinejoin={'round'}
                  d={'M13 7L10 4L7 7'}
                />
              ) : null}
              {direction === null || direction === 2 ? (
                <path
                  stroke={'currentColor'}
                  strokeWidth={'2'}
                  strokeLinecap={'round'}
                  strokeLinejoin={'round'}
                  d={'M7 13L10 16L13 13'}
                />
              ) : null}
            </svg>
          </div>
        ) : null}
      </span>
    </th>
  );
};

export const TableHead = ({ children }: { children: React.ReactNode }) => {
  return (
    <thead className={'bg-gray-800 border-t border-b border-gray-500'}>
      <tr>{children}</tr>
    </thead>
  );
};

export const TableBody = ({ children }: { children: React.ReactNode }) => {
  return <tbody>{children}</tbody>;
};

export const TableRow = ({
  onClick,
  className,
  onContextMenu,
  children,
}: {
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) => {
  return (
    <tr className={classNames('h-12 hover:bg-gray-600', className)} onClick={onClick} onContextMenu={onContextMenu}>
      {children}
    </tr>
  );
};

interface PaginationProps<T> {
  data: ResponseMeta<T>;
  onPageSelect: (page: number) => void;

  children: React.ReactNode;
}

export function Pagination<T>({ data, onPageSelect, children }: PaginationProps<T>) {
  const totalPages = Math.ceil(data.total / data.perPage);

  const setPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    onPageSelect(page);
  };

  const isFirstPage = data.page === 1;
  const isLastPage = data.page >= totalPages;

  const pages = [];

  if (totalPages < 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Don't ask me how this works, all I know is that this code will always have 7 items in the pagination,
    // and keeps the current page centered if it is not too close to the start or end.
    let start = Math.max(data.page - 3, 1);
    const end = Math.min(totalPages, data.page + (data.page < 4 ? 7 - data.page : 3));

    while (start !== 1 && end - start !== 6) {
      start--;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return (
    <>
      {children}

      <div className={'h-12 flex flex-row items-center w-full px-6 py-3 border-t border-gray-500'}>
        <p className={'text-sm leading-5 text-gray-400'}>
          Showing <span className={'text-gray-300'}>{(data.page - 1) * data.perPage + (data.total > 0 ? 1 : 0)}</span>{' '}
          to <span className={'text-gray-300'}>{(data.page - 1) * data.perPage + data.data.length}</span> of{' '}
          <span className={'text-gray-300'}>{data.total}</span> results
        </p>

        {isFirstPage && isLastPage ? null : (
          <div className={'flex flex-row ml-auto'}>
            <nav className={'relative z-0 inline-flex shadow-sm'}>
              <Button
                onClick={() => setPage(1)}
                size={Button.Sizes.Small}
                shape={Button.Shapes.IconSquare}
                variant={Button.Variants.Secondary}
                style={Button.Styles.Gray}
                disabled={data.page === 1}
              >
                <FontAwesomeIcon icon={faAngleDoubleLeft} />
              </Button>
              <Button
                onClick={() => setPage(data.page - 1)}
                size={Button.Sizes.Small}
                shape={Button.Shapes.IconSquare}
                variant={Button.Variants.Secondary}
                style={Button.Styles.Gray}
                disabled={data.page === 1}
              >
                <FontAwesomeIcon icon={faAngleLeft} />
              </Button>

              {pages.map((page) => (
                <Button
                  key={page}
                  onClick={() => setPage(page)}
                  size={Button.Sizes.Small}
                  shape={Button.Shapes.IconSquare}
                  variant={data.page === page ? Button.Variants.Primary : Button.Variants.Secondary}
                  style={data.page === page ? Button.Styles.Blue : Button.Styles.Gray}
                >
                  {page}
                </Button>
              ))}

              <Button
                onClick={() => setPage(data.page + 1)}
                size={Button.Sizes.Small}
                shape={Button.Shapes.IconSquare}
                variant={Button.Variants.Secondary}
                style={Button.Styles.Gray}
                disabled={data.page === totalPages}
              >
                <FontAwesomeIcon icon={faAngleRight} />
              </Button>
              <Button
                onClick={() => setPage(totalPages)}
                size={Button.Sizes.Small}
                shape={Button.Shapes.IconSquare}
                variant={Button.Variants.Secondary}
                style={Button.Styles.Gray}
                disabled={data.page === totalPages}
              >
                <FontAwesomeIcon icon={faAngleDoubleRight} />
              </Button>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}

export const NoItems = () => {
  return (
    <div className={'w-full flex flex-col items-center justify-center py-6 px-8'}>
      <p className={'text-lg text-gray-300 text-center font-normal'}>
        No items could be found, it&apos;s almost like they are hiding.
      </p>
    </div>
  );
};

interface Params {
  checked?: boolean;
  header?: React.ReactNode;
  onSelectAllClick?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (query: string) => Promise<void>;

  children: React.ReactNode;
}

export const ContentWrapper = ({ checked, header, onSelectAllClick, onSearch, children }: Params) => {
  const [_, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');

  const search = useCallback(
    debounce((query: string) => {
      if (onSearch === undefined) {
        return;
      }

      setLoading(true);
      onSearch(query).then(() => setLoading(false));
    }, 200),
    [],
  );

  return (
    <>
      <div className={'flex flex-row items-center h-12 px-6'}>
        {typeof onSelectAllClick === 'function' && (
          <div className={'flex flex-row items-center'}>
            <Checkbox name={'selectAll'} checked={checked} onChange={onSelectAllClick} />

            <svg
              xmlns={'http://www.w3.org/2000/svg'}
              viewBox={'0 0 20 20'}
              fill={'currentColor'}
              className={'w-4 h-4 ml-1 text-neutral-200'}
            >
              <path
                clipRule={'evenodd'}
                fillRule={'evenodd'}
                d={
                  'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                }
              />
            </svg>
          </div>
        )}
        {header}
        <div className={'flex flex-row items-center ml-auto'}>
          <Input.Text
            value={inputText}
            className={'h-8'}
            placeholder={'Search...'}
            onChange={(e) => {
              setInputText(e.currentTarget.value);
              search(e.currentTarget.value);
            }}
          />
        </div>
      </div>

      {children}
    </>
  );
};

export default ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={'flex flex-col w-full'}>
      <div className={'rounded-lg shadow-md bg-gray-700'}>{children}</div>
    </div>
  );
};
