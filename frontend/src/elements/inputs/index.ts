import Checkbox from '@/elements/inputs/Checkbox';
import InputField from '@/elements/inputs/InputField';
import Switch from './Switch';
import Dropdown from './Dropdown';
import Label from './Label';
import { MultiInput } from './MultiInput';
import Textarea from './Textarea';

const Input = Object.assign(
  {},
  {
    Label,
    Text: InputField,
    Checkbox,
    Switch,
    Dropdown,
    MultiInput,
    Textarea,
  },
);

export { Input };
export { default as styles } from './inputs.module.css';
