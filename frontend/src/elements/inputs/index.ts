import Checkbox from '@/elements/inputs/Checkbox';
import InputField from '@/elements/inputs/InputField';
import Switch from './Switch';
import Dropdown from './Dropdown';

const Input = Object.assign(
  {},
  {
    Text: InputField,
    Checkbox: Checkbox,
    Switch: Switch,
    Dropdown: Dropdown,
  },
);

export { Input };
export { default as styles } from './inputs.module.css';
