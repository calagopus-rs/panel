import { closestUnit, formatUnitBytes, mbToBytes, UNITS, unitToBytes } from '@/lib/size';
import Select from './Select';
import { useState, useEffect } from 'react';
import NumberInput from './NumberInput';

interface SizeInputProps {
  label?: string;
  withAsterisk?: boolean;
  mode: 'b' | 'mb';
  value: number;
  onChange: (value: number) => void;
}

export default function SizeInput({ mode, value, onChange, ...rest }: SizeInputProps) {
  const bytes = mode === 'b' ? value : mbToBytes(value);

  const [unit, setUnit] = useState(closestUnit(bytes));
  const [displayValue, setDisplayValue] = useState(formatUnitBytes(unit, bytes));

  useEffect(() => {
    setDisplayValue(formatUnitBytes(unit, bytes));
  }, [value]);

  const handleUnitChange = (newUnit: string | null) => {
    const newBytes = unitToBytes(newUnit as never, displayValue);

    setUnit(newUnit as never);
    onChange(mode === 'b' ? newBytes : newBytes / (1024 * 1024));
  };

  const handleValueChange = (v: number | string) => {
    if (typeof v === 'number') {
      setDisplayValue(v);
      const newBytes = unitToBytes(unit, v);
      onChange(mode === 'b' ? newBytes : newBytes / (1024 * 1024));
    }
  };

  return (
    <div className='relative'>
      <NumberInput {...rest} value={displayValue} onChange={handleValueChange} hideControls />
      <Select className='absolute bottom-0 right-0' data={UNITS} value={unit} onChange={handleUnitChange} maw={72} />
    </div>
  );
}
