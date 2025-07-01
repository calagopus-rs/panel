import Checkbox from '@/elements/inputs/Checkbox';
import InputField from '@/elements/inputs/InputField';
import Switch from './Switch';
import Dropdown from './Dropdown';
import Label from './Label';

const Input = Object.assign(
  {},
  {
    Label: Label,
    Text: InputField,
    Checkbox: Checkbox,
    Switch: Switch,
    Dropdown: Dropdown,
  },
);

export { Input };
export { default as styles } from './inputs.module.css';
