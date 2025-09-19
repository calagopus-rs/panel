import { getEmptyPaginationSet, httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import { load } from '@/lib/debounce';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import getLocationNodes from '@/api/admin/locations/nodes/getLocationNodes';
import NodeRow from '../../nodes/NodeRow';

export default ({ location }: { location: Location }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [locationNodes, setLocationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const [loading, setLoading] = useState(locationNodes.data.length === 0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getLocationNodes(location.uuid, page, search)
      .then((data) => {
        setLocationNodes(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <Title order={2}>
        Location Nodes
      </Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table
          columns={['', 'Id', 'Name', 'Location', 'URL', 'Servers', 'Created']}
          pagination={locationNodes}
          onPageSelect={setPage}
        >
          {locationNodes.data.map((node) => (
            <NodeRow key={node.uuid} node={node} />
          ))}
        </Table>
      )}
    </>
  );
};
