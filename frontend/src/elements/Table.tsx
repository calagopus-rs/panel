import { Center, Group, Pagination as MantinePagination, Table, TableTdProps, TableTrProps, Text } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import Spinner from '@/elements/Spinner';

export const TableHeader = ({ name }: { name?: string }) => {
  if (!name) {
    return <Table.Th className={'py-2'} />;
  }

  return <Table.Th>{name}</Table.Th>;
};

export const TableHead = ({ children }: { children: ReactNode }) => {
  return (
    <Table.Thead>
      <Table.Tr>{children}</Table.Tr>
    </Table.Thead>
  );
};

export const TableBody = ({ children }: { children: ReactNode }) => {
  return <Table.Tbody>{children}</Table.Tbody>;
};

export const TableRow = forwardRef<HTMLTableRowElement, TableTrProps>(({ className, children, ...rest }, ref) => {
  return (
    <Table.Tr ref={ref} className={className} {...rest}>
      {children}
    </Table.Tr>
  );
});

export const TableData = forwardRef<HTMLTableCellElement, TableTdProps>(({ className, children, ...rest }, ref) => {
  return (
    <Table.Td ref={ref} className={className} {...rest}>
      {children}
    </Table.Td>
  );
});

interface PaginationProps<T> {
  columns: string[];
  data: ResponseMeta<T>;
  onPageSelect: (page: number) => void;
}

export function Pagination<T>({ columns, data, onPageSelect }: PaginationProps<T>) {
  const totalPages = data.total === 0 ? 0 : Math.ceil(data.total / data.perPage);

  const setPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    onPageSelect(page);
  };

  const isFirstPage = data.page === 1;
  const isLastPage = data.page >= totalPages;

  const inner = (
    <Group justify={'space-between'}>
      <p className={'text-sm leading-5 text-gray-400'}>
        Showing&nbsp;
        <span className={'text-gray-300'}>{(data.page - 1) * data.perPage + (data.total > 0 ? 1 : 0)}</span>
        &nbsp;to&nbsp;
        <span className={'text-gray-300'}>{(data.page - 1) * data.perPage + data.data.length}</span>
        &nbsp;of&nbsp;<span className={'text-gray-300'}>{data.total}</span> results
      </p>
      {isFirstPage && isLastPage ? null : (
        <MantinePagination value={data.page} total={totalPages} withEdges onChange={setPage} />
      )}
    </Group>
  );

  return columns.length > 0 ? (
    <Table.Tr>
      <Table.Td colSpan={columns.length}>{inner}</Table.Td>
    </Table.Tr>
  ) : (
    inner
  );
}

export const NoItems = () => {
  return (
    <Center py={'lg'}>
      <Text c={'dimmed'}>No items could be found, it&apos;s almost like they are hiding.</Text>
    </Center>
  );
};

interface TableProps {
  columns: string[];
  loading?: boolean;
  pagination?: ResponseMeta<unknown>;
  onPageSelect?: (page: number) => void;
  allowSelect?: boolean;
  children: ReactNode;
}

export default ({ columns, loading, pagination, onPageSelect, allowSelect = true, children }: TableProps) => {
  return (
    <Table
      stickyHeader
      withTableBorder
      highlightOnHover={pagination?.total > 0}
      className={allowSelect ? undefined : 'select-none'}
    >
      <TableHead>
        {columns.map((column, index) => (
          <TableHeader name={column} key={`column-${index}`} />
        ))}
      </TableHead>
      <Table.Tbody>
        {loading ? (
          <Table.Tr>
            <Table.Td colSpan={columns.length}>
              <Spinner.Centered />
            </Table.Td>
          </Table.Tr>
        ) : pagination?.total === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={columns.length}>
              <NoItems />
            </Table.Td>
          </Table.Tr>
        ) : (
          children
        )}
      </Table.Tbody>
      {pagination ? (
        <Table.Tfoot>
          <Pagination columns={columns} data={pagination} onPageSelect={onPageSelect} />
        </Table.Tfoot>
      ) : null}
    </Table>
  );
};
