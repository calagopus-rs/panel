import Checkbox from '@/elements/inputs/Checkbox';
import InputField from '@/elements/inputs/InputField';
import Switch from './Switch';

const Input = Object.assign(
  {},
  {
    Text: InputField,
    Checkbox: Checkbox,
    Switch: Switch,
  },
);

export { Input };
export { default as styles } from './inputs.module.css';
