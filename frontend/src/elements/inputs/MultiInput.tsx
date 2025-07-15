import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import styles from './inputs.module.css';

interface MultiInputProps {
  options: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiInput: React.FC<MultiInputProps> = ({ options, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>(options);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onChange(selectedOptions);
  }, [selectedOptions, onChange]);

  const handleRemove = (option: string) => {
    setSelectedOptions(prev => prev.filter(item => item !== option));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
      if (!selectedOptions.includes(inputValue.trim())) {
        setSelectedOptions(prev => [...prev, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-wrap gap-2 p-2 bg-gray-700 rounded">
        {selectedOptions.map(option => (
          <span key={option} className="flex items-center gap-1 bg-gray-600 rounded px-2 py-1">
            {option}
            <button type="button" className="text-red-400 hover:text-red-600" onClick={() => handleRemove(option)}>
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={classNames(styles.text_input, 'bg-transparent flex-grow min-w-[120px]')}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};
