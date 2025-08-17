import React, { useCallback, useState } from 'react';
import { Center, Checkbox, Pagination as MantinePagination, Table, Text } from '@mantine/core';
import debounce from 'debounce';
import { Input } from '../inputs';

export const TableHeader = ({ name }: { name?: string }) => {
  if (!name) {
    return <Table.Th className={'py-2'} />;
  }

  return <Table.Th>{name}</Table.Th>;
};

export const TableHead = ({ children }: { children: React.ReactNode }) => {
  return (
    <Table.Thead>
      <Table.Tr>{children}</Table.Tr>
    </Table.Thead>
  );
};

export const TableBody = ({ children }: { children: React.ReactNode }) => {
  return <Table.Tbody>{children}</Table.Tbody>;
};

export const TableRow = ({
  onClick,
  onContextMenu,
  children,
}: {
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) => {
  return (
    <Table.Tr onClick={onClick} onContextMenu={onContextMenu}>
      {children}
    </Table.Tr>
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
          <MantinePagination className={'flex flex-row ml-auto'} total={totalPages} withEdges onChange={setPage} />
        )}
      </div>
    </>
  );
}

export const NoItems = () => {
  return (
    <Center py={'lg'}>
      <Text c={'dimmed'}>No activity found</Text>
    </Center>
  );
};

interface Params {
  checked?: boolean;
  header?: React.ReactNode;
  onSelectAllClick?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: (query: string) => void;

  children: React.ReactNode;
}

export const ContentWrapper = ({ checked, header, onSelectAllClick, onSearch, children }: Params) => {
  const [inputText, setInputText] = useState('');

  const search = useCallback(
    debounce((query: string) => {
      if (onSearch === undefined) {
        return;
      }

      onSearch(query);
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
    <Table striped highlightOnHover withTableBorder>
      {children}
    </Table>
  );
};
