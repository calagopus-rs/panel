import Checkbox from '@/elements/inputs/Checkbox';
import InputField from '@/elements/inputs/InputField';

const Input = Object.assign(
  {},
  {
    Text: InputField,
    Checkbox: Checkbox,
  },
);

export { Input };
export { default as styles } from './inputs.module.css';
