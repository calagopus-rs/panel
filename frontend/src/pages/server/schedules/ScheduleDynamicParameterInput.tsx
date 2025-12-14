import classNames from 'classnames';
import { useMemo } from 'react';
import Autocomplete from '@/elements/input/Autocomplete.tsx';
import Select from '@/elements/input/Select.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { useServerStore } from '@/stores/server.ts';

interface ScheduleDynamicParameterInputProps<
  N extends boolean,
  S extends boolean,
  Param = S extends true ? ScheduleDynamicParameter : ScheduleVariable,
> {
  textArea?: boolean;
  withAsterisk?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  allowNull?: N;
  allowString?: S;
  value: N extends true ? Param | null : Param;
  onChange: (value: N extends true ? Param | null : Param) => void;
}

export default function ScheduleDynamicParameterInput<N extends boolean = false, S extends boolean = true>({
  textArea = false,
  className,
  allowNull = false as never,
  allowString = true as never,
  value,
  onChange,
  ...rest
}: ScheduleDynamicParameterInputProps<N, S>) {
  const schedule = useServerStore((server) => server.schedule);
  const scheduleSteps = useServerStore((server) => server.scheduleSteps);

  const outputVariables = useMemo(() => {
    if (!schedule) {
      return [];
    }

    const outputVariables = new Set<string>();

    for (const trigger of schedule.triggers) {
      if ('outputInto' in trigger && trigger.outputInto) {
        outputVariables.add(trigger.outputInto.variable);
      }
    }

    for (const step of scheduleSteps) {
      if ('outputInto' in step.action && step.action.outputInto) {
        if (Array.isArray(step.action.outputInto)) {
          for (const outputInto of step.action.outputInto) {
            if (!outputInto) continue;

            outputVariables.add(outputInto.variable);
          }
        } else {
          outputVariables.add(step.action.outputInto.variable);
        }
      }
    }

    return [...outputVariables];
  }, [schedule, scheduleSteps]);

  return (
    <div className={classNames('grid grid-cols-6 gap-2', className)}>
      {value && typeof value === 'object' ? (
        <Autocomplete
          description='Please enter the variable name to evaluate.'
          className='col-span-4'
          value={value.variable}
          onChange={(v) => onChange({ variable: v })}
          data={outputVariables}
          {...rest}
        />
      ) : textArea ? (
        <TextArea description='Please enter the data to send.' className='col-span-4' {...rest} />
      ) : (
        <TextInput
          description={!allowString ? 'Please enter the variable name to evaluate.' : 'Please enter the data to send.'}
          className='col-span-4'
          disabled={allowNull && value === null}
          value={value || ''}
          onChange={(e) => onChange(e.target.value as never)}
          {...rest}
        />
      )}
      <Select
        label='Input Type'
        description='Data type to send'
        className='col-span-2'
        value={value === null ? 'null' : typeof value === 'string' ? 'raw' : 'variable'}
        data={[
          ...(allowNull
            ? [
                {
                  label: 'None',
                  value: 'null',
                },
              ]
            : []),
          ...(allowString
            ? [
                {
                  label: 'Raw String',
                  value: 'raw',
                },
              ]
            : []),
          {
            label: 'Variable',
            value: 'variable',
          },
        ]}
        onChange={(v) => {
          console.log(v, typeof value);
          switch (v) {
            case 'null':
              if (value !== null) {
                onChange(null as never);
              }
              break;
            case 'raw':
              if (typeof value !== 'string') {
                onChange('' as never);
              }
              break;
            case 'variable':
              if (value === null || typeof value !== 'object') {
                onChange({ variable: '' });
              }
              break;
          }
        }}
      />
    </div>
  );
}
