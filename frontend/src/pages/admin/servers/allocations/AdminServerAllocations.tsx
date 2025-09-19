import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { Ref, useEffect, useState } from "react";
import { useSearchParams } from 'react-router';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import { useAdminStore } from '@/stores/admin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import NodeAllocationRow from './ServerAllocationRow';
import SelectionArea from '@/elements/SelectionArea';
import Code from '@/elements/Code';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import deleteNodeAllocations from '@/api/admin/nodes/allocations/deleteNodeAllocations';
import getServerAllocations from "@/api/admin/servers/allocations/getServerAllocations";
import ServerAllocationRow from "./ServerAllocationRow";

export default ({ server }: { server: AdminServer }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const {
    serverAllocations,
    setServerAllocations,
  } = useAdminStore();

  const [openModal, setOpenModal] = useState<'add'>(null);
  const [loading, setLoading] = useState(serverAllocations.data.length === 0);
  const [page, setPage] = useState(1);

  const loadAllocations = () =>
    getServerAllocations(server.uuid, page)
      .then((data) => {
        setServerAllocations(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString() });
  }, [page]);

  useEffect(() => {
    loadAllocations();
  }, [page]);

  return (
    <>
      {/*<NodeAllocationsCreateModal*/}
      {/*  node={node}*/}
      {/*  loadAllocations={loadAllocations}*/}
      {/*  opened={openModal === 'create'}*/}
      {/*  onClose={() => setOpenModal(null)}*/}
      {/*/>*/}

      <Group justify={'space-between'} mb={'md'}>
        <Title order={2}>
          Node Allocations
        </Title>
        <Group>
          <Button onClick={() => setOpenModal('add')} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
          <Table
            columns={['Id', 'IP', 'IP Alias', 'Port', 'Created']}
            pagination={serverAllocations}
            onPageSelect={setPage}
          >
            {serverAllocations.data.map((allocation) => (
                <ServerAllocationRow key={allocation.uuid} allocation={allocation} />
            ))}
          </Table>
      )}
    </>
  );
};
