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
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter(
        option => option.toLowerCase().includes(inputValue.toLowerCase()) && !selectedOptions.includes(option),
      ),
    );
  }, [inputValue, options, selectedOptions]);

  useEffect(() => {
    onChange(selectedOptions);
  }, [selectedOptions, onChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    setSelectedOptions(prev => [...prev, option]);
    setInputValue('');
    setShowDropdown(false);
  };

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
          onFocus={() => setShowDropdown(true)}
          className={classNames(styles.text_input, 'bg-transparent flex-grow min-w-[120px]')}
          placeholder={placeholder}
        />
      </div>
      {showDropdown && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full bg-gray-800 rounded mt-1 max-h-48 overflow-auto shadow-lg">
          {filteredOptions.map(option => (
            <div
              key={option}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
