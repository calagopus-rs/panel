import { faFileDownload, faPlay, faPlayCircle, faShareAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import jsYaml from 'js-yaml';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { httpErrorToHuman } from '@/api/axios';
import deleteSchedule from '@/api/server/schedules/deleteSchedule';
import exportSchedule from '@/api/server/schedules/exportSchedule';
import triggerSchedule from '@/api/server/schedules/triggerSchedule';
import Badge from '@/elements/Badge';
import Code from '@/elements/Code';
import ContextMenu from '@/elements/ContextMenu';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

export default function ScheduleRow({ schedule }: { schedule: ServerSchedule }) {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { server, removeSchedule } = useServerStore();
  const navigateUrl = `/server/${server.uuidShort}/schedules/${schedule.uuid}`;

  const [openModal, setOpenModal] = useState<'delete' | null>(null);

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

  const doExport = (format: 'json' | 'yaml') => {
    exportSchedule(server.uuid, schedule.uuid)
      .then((data) => {
        addToast('Schedule exported.', 'success');

        if (format === 'json') {
          const jsonData = JSON.stringify(data, undefined, 2);
          const fileURL = URL.createObjectURL(new Blob([jsonData], { type: 'text/plain' }));
          const downloadLink = document.createElement('a');
          downloadLink.href = fileURL;
          downloadLink.download = `schedule-${schedule.uuid}.json`;
          document.body.appendChild(downloadLink);
          downloadLink.click();

          URL.revokeObjectURL(fileURL);
          downloadLink.remove();
        } else {
          const yamlData = jsYaml.dump(data, { flowLevel: -1, forceQuotes: true });
          const fileURL = URL.createObjectURL(new Blob([yamlData], { type: 'text/plain' }));
          const downloadLink = document.createElement('a');
          downloadLink.href = fileURL;
          downloadLink.download = `schedule-${schedule.uuid}.yml`;
          document.body.appendChild(downloadLink);
          downloadLink.click();

          URL.revokeObjectURL(fileURL);
          downloadLink.remove();
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doTriggerSchedule = (skipCondition: boolean) => {
    triggerSchedule(server.uuid, schedule.uuid, skipCondition).then(() => {
      addToast('Schedule triggered.', 'success');
    });
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Schedule Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{schedule.name}</Code> from this server?
      </ConfirmationModal>

      <ContextMenu
        items={[
          {
            icon: faPlay,
            label: 'Trigger',
            onClick: () => null,
            items: [
              {
                icon: faPlayCircle,
                label: 'Trigger (do not skip condition)',
                onClick: () => doTriggerSchedule(false),
                color: 'gray',
              },
              {
                icon: faPlay,
                label: 'Trigger (skip condition)',
                onClick: () => doTriggerSchedule(true),
                color: 'gray',
              },
            ],
          },
          {
            icon: faShareAlt,
            label: 'Export',
            onClick: () => null,
            items: [
              {
                icon: faFileDownload,
                label: 'as JSON',
                onClick: () => doExport('json'),
                color: 'gray',
              },
              {
                icon: faFileDownload,
                label: 'as YAML',
                onClick: () => doExport('yaml'),
                color: 'gray',
              },
            ],
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
            className='cursor-pointer'
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

            <TableData>
              <Tooltip label={formatDateTime(schedule.created)}>{formatTimestamp(schedule.created)}</Tooltip>
            </TableData>

            <ContextMenu.Toggle openMenu={openMenu} />
          </TableRow>
        )}
      </ContextMenu>
    </>
  );
}
