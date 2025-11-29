import {
  Center,
  Group,
  GroupProps,
  Pagination as MantinePagination,
  Paper,
  Stack,
  Table,
  TableTdProps,
  TableTrProps,
  Text,
} from '@mantine/core';
import { forwardRef, ReactNode } from 'react';
import Spinner from '@/elements/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCubesStacked } from '@fortawesome/free-solid-svg-icons';

export const TableHeader = ({ name }: { name?: string }) => {
  if (!name) {
    return <Table.Th className='py-2' />;
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
  data: ResponseMeta<T>;
  onPageSelect: (page: number) => void;
}

export function Pagination<T>({ data, onPageSelect, ...props }: PaginationProps<T> & GroupProps) {
  const totalPages = data.total === 0 ? 0 : Math.ceil(data.total / data.perPage);

  const setPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    onPageSelect(page);
  };

  const isFirstPage = data.page === 1;
  const isLastPage = data.page >= totalPages;

  const rangeStart = (data.page - 1) * data.perPage + 1;
  const rangeEnd = Math.min(data.page * data.perPage, data.total);

  return (
    <Group justify='space-between' hidden={rangeEnd === 0} {...props}>
      <p className='text-sm leading-5 text-gray-400'>
        Showing&nbsp;
        <span className='text-gray-300'>{rangeStart}</span>
        &nbsp;to&nbsp;
        <span className='text-gray-300'>{rangeEnd}</span>
        &nbsp;of&nbsp;<span className='text-gray-300'>{data.total}</span> results
      </p>
      {isFirstPage && isLastPage ? null : (
        <MantinePagination value={data.page} total={totalPages} withEdges onChange={setPage} />
      )}
    </Group>
  );
}

export const NoItems = () => {
  return (
    <Center py='lg'>
      <Stack align='center' c='dimmed'>
        <FontAwesomeIcon icon={faCubesStacked} size='3x' className='-mb-2' />
        <Text>No items could be found, it&apos;s almost like they are hiding.</Text>
      </Stack>
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
    <Paper withBorder radius='md' className='overflow-x-auto'>
      {pagination.total > pagination.perPage && <Pagination data={pagination} m='xs' onPageSelect={onPageSelect} />}

      <Table
        stickyHeader
        highlightOnHover={pagination?.total > 0 && !loading}
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
      </Table>

      {pagination && <Pagination data={pagination} m='xs' onPageSelect={onPageSelect} />}
    </Paper>
  );
};
