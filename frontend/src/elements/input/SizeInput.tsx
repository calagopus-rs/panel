import { useEffect, useRef, useState } from 'react';
import { closestUnit, formatUnitBytes, mbToBytes, UNITS, unitToBytes } from '@/lib/size.ts';
import NumberInput from './NumberInput.tsx';
import Select from './Select.tsx';

interface SizeInputProps {
  label?: string;
  withAsterisk?: boolean;
  mode: 'b' | 'mb';
  min: number;
  value: number;
  onChange: (value: number) => void;
}

export default function SizeInput({ mode, min, value, onChange, ...rest }: SizeInputProps) {
  const isSpecialValue = value === -1;
  const bytes = isSpecialValue ? -1 : mode === 'b' ? value : mbToBytes(value);

  const availableUnits = UNITS.slice(mode === 'mb' ? 2 : 0);

  const getAppropriateUnit = (bytes: number) => {
    if (bytes <= 0) return availableUnits[0];
    const closest = closestUnit(bytes);
    return availableUnits.includes(closest) ? closest : availableUnits[0];
  };

  const [unit, setUnit] = useState(() => getAppropriateUnit(bytes));
  const [displayValue, setDisplayValue] = useState(isSpecialValue ? -1 : formatUnitBytes(unit, bytes));

  const isInternalChange = useRef(false);

  useEffect(() => {
    if (value === -1) {
      setDisplayValue(-1);
    } else {
      const bytes = mode === 'b' ? value : mbToBytes(value);

      if (!isInternalChange.current) {
        const newUnit = getAppropriateUnit(bytes);
        setUnit(newUnit);
        setDisplayValue(formatUnitBytes(newUnit, bytes));
      } else {
        setDisplayValue(formatUnitBytes(unit, bytes));
      }
    }
    isInternalChange.current = false;
  }, [value, mode]);

  const handleUnitChange = (newUnit: string | null) => {
    if (displayValue === -1 || !newUnit) return;

    const newBytes = unitToBytes(newUnit as never, displayValue);

    isInternalChange.current = true;
    setUnit(newUnit as never);
    onChange(mode === 'b' ? newBytes : newBytes / (1024 * 1024));
  };

  const handleValueChange = (v: number | string) => {
    if (typeof v === 'number') {
      setDisplayValue(v);

      if (v === -1) {
        onChange(-1);
        return;
      }

      isInternalChange.current = true;
      const newBytes = unitToBytes(unit, v);
      onChange(mode === 'b' ? newBytes : newBytes / (1024 * 1024));
    }
  };

  return (
    <div className='relative'>
      <NumberInput {...rest} min={min} value={displayValue} onChange={handleValueChange} hideControls />
      <Select
        className='absolute bottom-0 right-0'
        data={availableUnits}
        value={unit}
        onChange={handleUnitChange}
        maw={72}
        disabled={displayValue === -1}
      />
    </div>
  );
}
