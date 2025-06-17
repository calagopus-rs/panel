import debounce from 'debounce';
import React, { useCallback, useState } from 'react';
import Spinner from '@/elements/Spinner';
import classNames from 'classnames';
import { Input } from '../inputs';
import Checkbox from '../inputs/Checkbox';

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

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationDataSet;
}

export interface PaginationDataSet {
  total: number;
  count: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
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
    return <th className="py-2" />;
  }

  return (
    <th className="px-6 py-2" onClick={onClick}>
      <span className="flex flex-row items-center cursor-pointer">
        <span className="text-xs font-medium tracking-wider uppercase text-gray-300 whitespace-nowrap select-none">
          {name}
        </span>

        {direction !== undefined ? (
          <div className="ml-1">
            <svg fill="none" viewBox="0 0 20 20" className="w-4 h-4 text-gray-400">
              {direction === null || direction === 1 ? (
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7L10 4L7 7"
                />
              ) : null}
              {direction === null || direction === 2 ? (
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 13L10 16L13 13"
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
    <thead className="bg-gray-800 border-t border-b border-gray-500">
      <tr>{children}</tr>
    </thead>
  );
};

export const TableBody = ({ children }: { children: React.ReactNode }) => {
  return <tbody>{children}</tbody>;
};

export const TableRow = ({ children }: { children: React.ReactNode }) => {
  return <tr className="h-12 hover:bg-gray-600">{children}</tr>;
};

interface PaginationButtonProps {
  active?: boolean;
}

function PaginationButton({ active, children, ...props }: PaginationButtonProps & React.ComponentProps<'button'>) {
  return (
    <button
      className={classNames(
        'relative items-center px-3 py-1 -ml-px text-sm font-normal leading-5 transition duration-150 ease-in-out border border-gray-500 focus:z-10 focus:outline-none focus:border-primary-300 inline-flex',
        [active ? 'bg-gray-500 text-gray-50' : 'bg-gray-600 text-gray-200 hover:text-gray-50'],
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function PaginationArrow({ children, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={classNames(
        'relative inline-flex items-center px-1 py-1 text-sm font-medium leading-5 transition duration-150 ease-in-out border border-gray-500 bg-gray-600 text-gray-400 hover:text-gray-50 focus:z-10 focus:outline-none focus:border-primary-300',
        [props.disabled ? 'bg-gray-700 hover:text-gray-400 cursor-default' : 'cursor-pointer'],
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface PaginationProps<T> {
  data?: PaginatedResult<T>;
  onPageSelect: (page: number) => void;

  children: React.ReactNode;
}

export function Pagination<T>({ data, onPageSelect, children }: PaginationProps<T>) {
  let pagination: PaginationDataSet;
  if (data === undefined) {
    pagination = {
      total: 0,
      count: 0,
      perPage: 0,
      currentPage: 1,
      totalPages: 1,
    };
  } else {
    pagination = data.pagination;
  }

  const setPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) {
      return;
    }

    onPageSelect(page);
  };

  const isFirstPage = pagination.currentPage === 1;
  const isLastPage = pagination.currentPage >= pagination.totalPages;

  const pages = [];

  if (pagination.totalPages < 7) {
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Don't ask me how this works, all I know is that this code will always have 7 items in the pagination,
    // and keeps the current page centered if it is not too close to the start or end.
    let start = Math.max(pagination.currentPage - 3, 1);
    const end = Math.min(
      pagination.totalPages,
      pagination.currentPage + (pagination.currentPage < 4 ? 7 - pagination.currentPage : 3),
    );

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

      <div className="h-12 flex flex-row items-center w-full px-6 py-3 border-t border-gray-500">
        <p className="text-sm leading-5 text-gray-400">
          Showing{' '}
          <span className="text-gray-300">
            {(pagination.currentPage - 1) * pagination.perPage + (pagination.total > 0 ? 1 : 0)}
          </span>{' '}
          to{' '}
          <span className="text-gray-300">{(pagination.currentPage - 1) * pagination.perPage + pagination.count}</span>{' '}
          of <span className="text-gray-300">{pagination.total}</span> results
        </p>

        {isFirstPage && isLastPage ? null : (
          <div className="flex flex-row ml-auto">
            <nav className="relative z-0 inline-flex shadow-sm">
              <PaginationArrow
                type="button"
                className="rounded-l-md"
                aria-label="Previous"
                disabled={pagination.currentPage === 1}
                onClick={() => setPage(pagination.currentPage - 1)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  />
                </svg>
              </PaginationArrow>

              {pages.map(page => (
                <PaginationButton
                  key={page}
                  type="button"
                  onClick={() => setPage(page)}
                  active={pagination.currentPage === page}
                >
                  {page}
                </PaginationButton>
              ))}

              <PaginationArrow
                type="button"
                className="-ml-px rounded-r-md"
                aria-label="Next"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => setPage(pagination.currentPage + 1)}
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  />
                </svg>
              </PaginationArrow>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}

export const Loading = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center" style={{ height: '3rem' }}>
      <Spinner />
    </div>
  );
};

export const NoItems = ({ className }: { className?: string }) => {
  return (
    <div className={classNames('w-full flex flex-col items-center justify-center py-6 px-8', className)}>
      <div className="h-48 flex">
        <img src={'/assets/svgs/not_found.svg'} alt={'No Items'} className="h-full select-none" />
      </div>

      <p className="text-lg text-gray-300 text-center font-normal sm:mt-8">
        No items could be found, it&apos;s almost like they are hiding.
      </p>
    </div>
  );
};

interface Params {
  checked: boolean;
  onSelectAllClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (query: string) => Promise<void>;

  children: React.ReactNode;
}

export const ContentWrapper = ({ checked, onSelectAllClick, onSearch, children }: Params) => {
  const [loading, setLoading] = useState(false);
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
      <div className="flex flex-row items-center h-12 px-6">
        <div className="flex flex-row items-center">
          <Checkbox name={'selectAll'} checked={checked} onChange={onSelectAllClick} />

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 ml-1 text-neutral-200"
          >
            <path
              clipRule="evenodd"
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            />
          </svg>
        </div>
        <div className="flex flex-row items-center ml-auto">
          <Input.Text
            value={inputText}
            className="h-8"
            placeholder="Search..."
            onChange={e => {
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
    <div className="flex flex-col w-full">
      <div className="rounded-lg shadow-md bg-gray-700">{children}</div>
    </div>
  );
};
