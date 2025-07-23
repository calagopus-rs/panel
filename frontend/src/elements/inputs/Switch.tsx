import React, { useMemo } from 'react';
import styles from './inputs.module.css';
import classNames from 'classnames';
import { v4 as uuidv4 } from 'uuid';

export interface SwitchProps {
  name: string;
  label?: string;
  description?: string;
  defaultChecked?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

const Switch = ({ name, label, description, defaultChecked, readOnly, onChange, children }: SwitchProps) => {
  const uuid = useMemo(() => uuidv4(), []);

  return (
    <div
      className={classNames(
        'flex items-center',
        (label || description) && 'bg-gray-700 border border-gray-800 shadow-inner p-4 rounded',
      )}
    >
      <div className={classNames('flex-none', styles.switch_input)}>
        {children || (
          <input
            id={uuid}
            name={name}
            type={'checkbox'}
            onChange={(e) => onChange && onChange(e)}
            defaultChecked={defaultChecked}
            disabled={readOnly}
            className={'hidden'}
          />
        )}
        <label htmlFor={uuid} />
      </div>
      {(label || description) && (
        <div className={'ml-4 w-full'}>
          {label && (
            <label className={classNames('cursor-pointer', !!description && 'mb-0')} htmlFor={uuid}>
              {label}
            </label>
          )}
          {description && <p className={'text-neutral-400 text-sm'}>{description}</p>}
        </div>
      )}
    </div>
  );
};

export default Switch;
