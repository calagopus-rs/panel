import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import styles from './inputs.module.css';

interface MultiKeyValueInputProps {
  options: Record<string, string>; // { key: value, ... }
  onChange: (selected: Record<string, string>) => void;
  placeholderKey?: string;
  placeholderValue?: string;
}

export const MultiKeyValueInput: React.FC<MultiKeyValueInputProps> = ({
  options,
  onChange,
  placeholderKey = 'Key',
  placeholderValue = 'Value',
}) => {
  const [selectedOptions, setSelectedOptions] = useState<{ key: string; value: string }[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const keyInputRef = useRef<HTMLInputElement>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Convert incoming object to array form
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

  const handleRemove = (keyToRemove: string) => {
    const newOptions = selectedOptions.filter((item) => item.key !== keyToRemove);
    setSelectedOptions(newOptions);
    emitChange(newOptions);
  };

  const handleAdd = () => {
    const trimmedKey = newKey.trim();
    const trimmedValue = newValue.trim();
    if (!trimmedKey || !trimmedValue) return;

    if (selectedOptions.some((opt) => opt.key === trimmedKey)) {
      // Prevent duplicate keys
      return;
    }

    const newOptions = [...selectedOptions, { key: trimmedKey, value: trimmedValue }];
    setSelectedOptions(newOptions);
    emitChange(newOptions);

    setNewKey('');
    setNewValue('');
    keyInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className={'relative'}>
      <div className={'flex flex-wrap gap-2 p-2 bg-gray-700 rounded'}>
        {selectedOptions.map(({ key, value }) => (
          <span key={key} className={'flex items-center gap-2 bg-gray-600 rounded px-2 py-1'}>
            <span className={'font-semibold'}>{key}</span>
            <span className={'text-gray-300'}>:</span>
            <span>{value}</span>
            <button type={'button'} className={'text-red-400 hover:text-red-600'} onClick={() => handleRemove(key)}>
              &times;
            </button>
          </span>
        ))}
        <div className={'flex gap-2 items-center'}>
          <input
            ref={keyInputRef}
            type={'text'}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={handleKeyDown}
            className={classNames(styles.text_input, 'bg-transparent w-[120px]')}
            placeholder={placeholderKey}
          />
          <input
            ref={valueInputRef}
            type={'text'}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={classNames(styles.text_input, 'bg-transparent w-[240px]')}
            placeholder={placeholderValue}
          />
          <button
            type={'button'}
            className={'bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded'}
            onClick={handleAdd}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
