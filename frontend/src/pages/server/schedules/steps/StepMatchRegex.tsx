import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Stack, Title } from '@mantine/core';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';

export default function StepMatchRegex({
  action,
  setAction,
}: {
  action: ScheduleActionMatchRegex;
  setAction: (action: ScheduleActionMatchRegex) => void;
}) {
  return (
    <Stack>
      <ScheduleDynamicParameterInput
        label='Input'
        placeholder='The input data to be matched by the regex'
        value={action.input}
        onChange={(v) => setAction({ ...action, input: v })}
      />

      <TextInput
        label='Regex'
        placeholder='The regex to use for matching, must comply with https://crates.io/crates/regex'
        value={action.regex}
        onChange={(e) => setAction({ ...action, regex: e.target.value })}
      />

      <div>
        <Title order={4} mb='sm'>
          Outputs
        </Title>
        {action.outputInto.map((outputInto, index) => (
          <div key={`output-${index}`} className='flex flex-row items-end space-x-2 mb-2'>
            <ScheduleDynamicParameterInput
              label={`Output ${index + 1}`}
              allowNull
              allowString={false}
              value={outputInto}
              onChange={(v) =>
                setAction({ ...action, outputInto: [...action.outputInto.map((p, i) => (i === index ? v : p))] })
              }
            />

            <ActionIcon
              size='input-sm'
              color='red'
              variant='light'
              onClick={() => setAction({ ...action, outputInto: [...action.outputInto.filter((_, i) => i !== index)] })}
            >
              <FontAwesomeIcon icon={faMinus} />
            </ActionIcon>
          </div>
        ))}

        <Button
          onClick={() => setAction({ ...action, outputInto: [...action.outputInto, { variable: '' }] })}
          variant='light'
          leftSection={<FontAwesomeIcon icon={faPlus} />}
        >
          Add Output
        </Button>
      </div>
    </Stack>
  );
}
