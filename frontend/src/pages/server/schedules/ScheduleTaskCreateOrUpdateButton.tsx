import { httpErrorToHuman } from '@/api/axios';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import { Button } from '@/elements/button';
import { Dialog } from '@/elements/dialog';
import { Input } from '@/elements/inputs';
import { useToast } from '@/elements/Toast';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';

export default ({ schedule, task, onUpdate }: { schedule: Schedule; task?: Task; onUpdate?: (task: Task) => void }) => {
  const server = useServerStore(state => state.data);
  const { addSchedule } = useServerStore(state => state.schedules);
  const { addToast } = useToast();

  const [open, setOpen] = useState(false);

  const [taskAction, setTaskAction] = useState(task?.action ?? 'command');
  const [taskPayload, setTaskPayload] = useState(task?.payload ?? '');
  const [taskOffset, setTaskOffset] = useState(task?.timeOffset ?? 0);
  const [taskContinueOnFailure, setTaskContinueOnFailure] = useState(task?.continueOnFailure ?? false);

  const submit = () => {
    createOrUpdateScheduleTask(server.id, schedule.id, task.id, {
      action: taskAction,
      payload: taskPayload,
      timeOffset: taskOffset,
      continueOnFailure: taskContinueOnFailure,
    })
      .then(resTask => {
        // if (schedule) {
        //   onUpdate?.(resSchedule);
        // } else {
        //   addSchedule(resSchedule);
        // }
        setOpen(false);
        addToast(task ? 'Task updated.' : 'Task created.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog title={task ? 'Update Task' : 'Create Task'} onClose={() => setOpen(false)} open={open}>
        <label htmlFor={'taskAction'} className={'block mt-3 font-bold'}>
          Action
        </label>
        <Input.Dropdown
          id={'taskAction'}
          options={[
            { label: 'Run Command', value: 'command' },
            { label: 'Power Action', value: 'power' },
            { label: 'Create Backup', value: 'backup' },
          ]}
          selected={taskAction}
          onChange={e => setTaskAction(e.target.value)}
        />

        <label htmlFor={'taskPayload'} className={'block mt-3 font-bold'}>
          Payload
        </label>
        <Input.Text
          id={'taskPayload'}
          name={'taskPayload'}
          placeholder={'Payload'}
          value={taskPayload}
          onChange={e => setTaskPayload(e.target.value)}
        />

        <label htmlFor={'taskOffset'} className={'block mt-3 font-bold'}>
          Time Offset
        </label>
        <Input.Text
          id={'taskOffset'}
          name={'taskOffset'}
          type={'number'}
          placeholder={'Time Offset'}
          value={taskOffset}
          onChange={e => setTaskOffset(parseInt(e.target.value))}
        />

        <label htmlFor={'taskContinueOnFailure'} className={'block mt-3 font-bold'}>
          Continue On Failure
        </label>
        <Input.Switch
          description={'Future tasks will be run when this task fails.'}
          name={'taskContinueOnFailure'}
          defaultChecked={taskContinueOnFailure}
          onChange={e => setTaskContinueOnFailure(e.target.checked)}
        />

        <Dialog.Footer>
          <Button style={Button.Styles.Green} onClick={submit}>
            {task ? 'Update' : 'Create'}
          </Button>
          <Button style={Button.Styles.Gray} onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>
      <Button onClick={() => setOpen(true)}>{task ? 'Edit' : 'Create new'}</Button>
    </>
  );
};
