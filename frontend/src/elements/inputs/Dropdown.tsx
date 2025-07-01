interface DropdownProps {
  id: string;
  options: {
    label: string;
    value: string;
  }[];
  selected: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default ({ id, options, selected, onChange }: DropdownProps) => {
  return (
    <select
      id={id}
      value={selected}
      onChange={onChange}
      className="mt-1 block w-full py-2 px-4 border border-gray-600 bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300/75"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
