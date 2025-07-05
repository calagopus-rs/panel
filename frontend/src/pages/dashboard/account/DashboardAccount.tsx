import Container from '@/elements/Container';
import { Input } from '@/elements/inputs';
import PasswordContainer from './PasswordContainer';

export default () => {
  return (
    <Container>
      <div className="grid grid-cols-3 gap-4">
        <PasswordContainer />
        <div className="bg-gray-700/50 rounded-md p-4">
          <h1 className="text-4xl font-bold text-white">Update Email</h1>
        </div>
        <div className="bg-gray-700/50 rounded-md p-4">
          <h1 className="text-4xl font-bold text-white">Two-Step Verification</h1>
        </div>
      </div>
    </Container>
  );
};
