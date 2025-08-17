import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import styles from './inputs.module.css';

interface MultiInputProps {
  availableOptions: string[]; // fixed preset options
  value: string[]; // currently selected
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiInput: React.FC<MultiInputProps> = ({ availableOptions, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>(value);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedOptions(value);
  }, [value]);

  const handleRemove = (option: string) => {
    const newOptions = selectedOptions.filter((item) => item !== option);
    setSelectedOptions(newOptions);
    onChange(newOptions);
  };

  const handleSelect = (option: string) => {
    if (!selectedOptions.includes(option)) {
      const newOptions = [...selectedOptions, option];
      setSelectedOptions(newOptions);
      onChange(newOptions);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const filteredOptions = availableOptions.filter(
    (opt) => !selectedOptions.includes(opt) && opt.toLowerCase().includes(inputValue.toLowerCase()),
  );

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='relative' ref={dropdownRef}>
      <div className='flex flex-wrap gap-2 p-2 bg-gray-700 rounded'>
        {selectedOptions.map((option) => (
          <span key={option} className='flex items-center gap-1 bg-gray-600 rounded px-2 py-1'>
            {option}
            <button type='button' className='text-red-400 hover:text-red-600' onClick={() => handleRemove(option)}>
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type='text'
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={classNames(styles.text_input, 'bg-transparent flex-grow min-w-[120px]')}
          placeholder={placeholder}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className='absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 max-h-40 overflow-y-auto'>
          {filteredOptions.map((opt) => (
            <div key={opt} onClick={() => handleSelect(opt)} className='px-3 py-2 cursor-pointer hover:bg-gray-700'>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
