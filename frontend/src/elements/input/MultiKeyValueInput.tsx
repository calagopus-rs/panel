import { Button, Group, Stack, TagsInput, TextInput } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

interface MultiKeyValueInputProps {
  options: Record<string, string>; // { key: value, ... }
  onChange: (selected: Record<string, string>) => void;
  transformValue?: (key: string, value: string) => string;
  hideKey?: (key: string) => boolean;
  placeholderKey?: string;
  placeholderValue?: string;
}

export default function MultiKeyValueInput({
  options,
  onChange,
  transformValue,
  hideKey,
  placeholderKey = 'Key',
  placeholderValue = 'Value',
}: MultiKeyValueInputProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    {
      key: string;
      value: string;
    }[]
  >([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const keyInputRef = useRef<HTMLInputElement>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const arr = Object.entries(options).map(([key, value]) => ({ key, value }));
    setSelectedOptions(arr);
  }, [options]);

  const emitChange = (arr: { key: string; value: string }[]) => {
    const obj: Record<string, string> = {};
    arr.forEach(({ key, value }) => {
      obj[key] = value;
    });
    onChange(obj);
  };

  const handleRemove = (index: number) => {
    const newOptions = selectedOptions.filter((_, i) => i !== index);
    setSelectedOptions(newOptions);
    emitChange(newOptions);
  };

  const handleAdd = () => {
    const trimmedKey = newKey.trim();
    const trimmedValue = newValue.trim();
    if (!trimmedKey || !trimmedValue) return;

    if (selectedOptions.some((opt) => opt.key === trimmedKey)) return;

    const newOptions = [...selectedOptions, { key: trimmedKey, value: trimmedValue }];
    setSelectedOptions(newOptions);
    emitChange(newOptions);

    setNewKey('');
    setNewValue('');
    keyInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const displayedTags = selectedOptions
    .filter(({ key }) => !hideKey?.(key))
    .map(({ key, value }) => `${key}: ${transformValue ? transformValue(key, value) : value}`);

  return (
    <Stack gap='sm'>
      <TagsInput
        value={displayedTags}
        onChange={(tags) => {
          // Removing tags
          if (tags.length < selectedOptions.length) {
            handleRemove(selectedOptions.length - 1);
          }
        }}
        readOnly
        label='Selected key-value pairs'
        placeholder='No pairs added'
      />

      <Group gap='sm' align='flex-end'>
        <TextInput
          ref={keyInputRef}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderKey}
          w={140}
        />
        <TextInput
          ref={valueInputRef}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderValue}
          w={220}
        />
        <Button onClick={handleAdd} color='green'>
          Add
        </Button>
      </Group>
    </Stack>
  );
}
