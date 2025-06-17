import { ClipLoader } from 'react-spinners';

export default function Spinner({ size }: { size?: number }) {
  return <ClipLoader size={size} aria-label="Loading Spinner" data-testid="loader" color="#fff" />;
}
