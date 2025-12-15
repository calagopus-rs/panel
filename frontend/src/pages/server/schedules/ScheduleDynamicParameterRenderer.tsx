import Badge from '@/elements/Badge.tsx';
import Code from '@/elements/Code.tsx';

interface ScheduleDynamicParameterRendererProps {
  value: ScheduleDynamicParameter | null;
}

export default function ScheduleDynamicParameterRenderer({ value }: ScheduleDynamicParameterRendererProps) {
  return value === null ? (
    <Code>None</Code>
  ) : typeof value === 'string' ? (
    <Code>{value}</Code>
  ) : (
    <>
      <Badge size='xs'>Variable</Badge>
      <Code>{value.variable}</Code>
    </>
  );
}
