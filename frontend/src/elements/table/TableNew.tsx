import { Center, Group, Pagination as MantinePagination, Table, TableTrProps, Text } from '@mantine/core';
import { forwardRef } from 'react';

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

export const TableRow = forwardRef<HTMLTableRowElement, TableTrProps>(({ className, children, ...rest }, ref) => {
  return (
    <Table.Tr ref={ref} className={className} {...rest}>
      {children}
    </Table.Tr>
  );
});

export const TableData = ({ children }: { children: React.ReactNode }) => {
  return <Table.Td>{children}</Table.Td>;
};

interface PaginationProps<T> {
  columns: string[];
  data: ResponseMeta<T>;
  onPageSelect: (page: number) => void;
}

export function Pagination<T>({ columns, data, onPageSelect }: PaginationProps<T>) {
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
    <Table.Tr>
      <Table.Td colSpan={columns.length}>
        <Group justify={'space-between'}>
          <p className={'text-sm leading-5 text-gray-400'}>
            Showing&nbsp;
            <span className={'text-gray-300'}>{(data.page - 1) * data.perPage + (data.total > 0 ? 1 : 0)}</span>
            &nbsp;to&nbsp;
            <span className={'text-gray-300'}>{(data.page - 1) * data.perPage + data.data.length}</span>
            &nbsp;of&nbsp;<span className={'text-gray-300'}>{data.total}</span> results
          </p>
          {isFirstPage && isLastPage ? null : <MantinePagination total={totalPages} withEdges onChange={setPage} />}
        </Group>
      </Table.Td>
    </Table.Tr>
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
  pagination: ResponseMeta<unknown>;
  onPageSelect: (page: number) => void;
  children: React.ReactNode;
}

export default ({ columns, pagination, onPageSelect, children }: TableProps) => {
  return (
    <Table striped highlightOnHover={pagination.total > 0} withTableBorder>
      <TableHead>
        {columns.map((column, index) => (
          <TableHeader name={column} key={`column-${index}`} />
        ))}
      </TableHead>
      <Table.Tbody>
        {pagination.total === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={columns.length}>
              <NoItems />
            </Table.Td>
          </Table.Tr>
        ) : (
          children
        )}
      </Table.Tbody>
      <Table.Tfoot>
        <Pagination columns={columns} data={pagination} onPageSelect={onPageSelect} />
      </Table.Tfoot>
    </Table>
  );
};
