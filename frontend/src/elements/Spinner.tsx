import { Suspense } from 'react';
import { ClipLoader } from 'react-spinners';

function Spinner({ size }: { size?: number }) {
  return <ClipLoader size={size} aria-label="Loading Spinner" data-testid="loader" color="#fff" />;
}

Spinner.Suspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    }
  >
    {children}
  </Suspense>
);

export default Spinner;
