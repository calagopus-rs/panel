import { ReactNode, Suspense } from 'react';
import { ClipLoader } from 'react-spinners';

function Spinner({ size }: { size?: number }) {
  return <ClipLoader size={size} aria-label={'Loading Spinner'} data-testid={'loader'} color={'#fff'} />;
}

Spinner.Centered = ({ size }: { size?: number }) => (
  <div className={'flex items-center justify-center py-6'}>
    <Spinner size={size} />
  </div>
);

Spinner.Suspense = ({ children }: { children: ReactNode }) => (
  <Suspense
    fallback={
      <div className={'flex items-center justify-center'}>
        <Spinner />
      </div>
    }
  >
    {children}
  </Suspense>
);

export default Spinner;
