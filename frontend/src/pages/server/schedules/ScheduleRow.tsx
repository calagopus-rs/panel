import { httpErrorToHuman } from '@/api/axios';
import deleteSchedule from '@/api/server/schedules/deleteSchedule';
import Badge from '@/elements/Badge';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faEye, faPencil, faPlay, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export default ({ schedule }: { schedule: ServerSchedule }) => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { server, removeSchedule } = useServerStore();
  const navigateUrl = `/server/${server.uuidShort}/schedules/${schedule.uuid}`;

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const doDelete = async () => {
    await deleteSchedule(server.uuid, schedule.uuid)
      .then(() => {
        addToast('Schedule deleted.', 'success');
        setOpenModal(null);
        removeSchedule(schedule);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Schedule Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{schedule.name}</Code> from this server?
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faEye,
            label: 'View',
            onClick: () => navigate(navigateUrl),
          },
          {
            icon: faPencil,
            label: 'Edit',
            onClick: () => navigate(`${navigateUrl}/edit`),
          },
          {
            icon: faPlay,
            label: 'Run Now',
            onClick: () => alert('Soon'),
          },
          {
            icon: faTrash,
            label: 'Delete',
            onClick: () => setOpenModal('delete'),
            color: 'red',
          },
        ]}
      >
        {({ openMenu }) => (
          <TableRow
            className={'cursor-pointer'}
            onContextMenu={(e) => {
              e.preventDefault();
              openMenu(e.clientX, e.clientY);
            }}
            onClick={() => navigate(navigateUrl)}
          >
            <TableData>{schedule.name}</TableData>

            <TableData>
              <Tooltip label={schedule.lastRun ? formatDateTime(schedule.lastRun) : 'N/A'}>
                {schedule.lastRun ? formatTimestamp(schedule.lastRun) : 'N/A'}
              </Tooltip>
            </TableData>

            <TableData>
              <Tooltip label={schedule.lastFailure ? formatDateTime(schedule.lastFailure) : 'N/A'}>
                {schedule.lastFailure ? formatTimestamp(schedule.lastFailure) : 'N/A'}
              </Tooltip>
            </TableData>

            <TableData>
              <Badge color={schedule.enabled ? 'green' : 'red'}>{schedule.enabled ? 'Active' : 'Inactive'}</Badge>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
};
