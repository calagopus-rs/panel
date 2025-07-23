import { httpErrorToHuman } from '@/api/axios';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';

export default ({ schedule, task, onSubmit }: { schedule: any; task?: any; onSubmit: (task: any) => void }) => {
  const server = useServerStore((state) => state.server);
  const { addToast } = useToast();

  const [open, setOpen] = useState(false);

  const [taskAction, setTaskAction] = useState(task?.action ?? 'command');
  const [taskPayload, setTaskPayload] = useState(task?.payload ?? '');
  const [taskOffset, setTaskOffset] = useState(task?.timeOffset ?? 0);
  const [taskContinueOnFailure, setTaskContinueOnFailure] = useState(task?.continueOnFailure ?? false);

  const submit = () => {
    createOrUpdateScheduleTask(server.uuid, schedule.id, task?.id, {
      action: taskAction,
      payload: taskPayload,
      timeOffset: taskOffset,
      continueOnFailure: taskContinueOnFailure,
    })
      .then((resTask) => {
        onSubmit(resTask);
        setOpen(false);
        addToast(task ? 'Task updated.' : 'Task created.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={task ? 'Update Task' : 'Create Task'} onClose={() => setOpen(false)} open={open}>
        <Input.Label htmlFor={'taskAction'}>Action</Input.Label>
        <Input.Dropdown
          id={'taskAction'}
          options={[
            { label: 'Run Command', value: 'command' },
            { label: 'Power Action', value: 'power' },
            { label: 'Create Backup', value: 'backup' },
          ]}
          selected={taskAction}
          onChange={(e) => setTaskAction(e.target.value)}
        />

        <Input.Label htmlFor={'taskPayload'}>Payload</Input.Label>
        <Input.Text
          id={'taskPayload'}
          name={'taskPayload'}
          placeholder={'Payload'}
          value={taskPayload}
          onChange={(e) => setTaskPayload(e.target.value)}
        />

        <Input.Label htmlFor={'taskOffset'}>Time Offset</Input.Label>
        <Input.Text
          id={'taskOffset'}
          name={'taskOffset'}
          type={'number'}
          placeholder={'Time Offset'}
          value={taskOffset}
          onChange={(e) => setTaskOffset(parseInt(e.target.value))}
        />

        <Input.Label htmlFor={'taskContinueOnFailure'}>Continue On Failure</Input.Label>
        <Input.Switch
          description={'Future tasks will be run when this task fails.'}
          name={'taskContinueOnFailure'}
          defaultChecked={taskContinueOnFailure}
          onChange={(e) => setTaskContinueOnFailure(e.target.checked)}
        />

        <Dialog.Footer>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button style={Button.Styles.Green} onClick={submit}>
            {task ? 'Update' : 'Create'}
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button onClick={() => setOpen(true)}>{task ? 'Edit' : 'Create'}</Button>
    </>
  );
};
