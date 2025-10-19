import TextInput from '@/elements/input/TextInput';
import { TextInputProps } from '@mantine/core';
import { parseSize } from '@/lib/size';

export default ({
  setState,
  onChange,
  ...rest
}: Omit<TextInputProps, 'onChange'> & {
  setState: (value: string) => void;
  onChange: (value: number) => void;
}) => {
  return (
    <TextInput
      {...rest}
      onChange={(e) => {
        const input = e.currentTarget.value;
        setState(input);

        try {
          const parsed = parseSize(input);
          if (parsed > 0) {
            onChange(parsed);
          }
        } catch {
          // ignore invalid intermediate states
        }
      }}
    />
  );
};
