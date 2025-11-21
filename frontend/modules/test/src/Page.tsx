import { useAuth } from '@/providers/AuthProvider';

export default function JohnPorkPage() {
  const { user } = useAuth();

  return <>PLEASE HELP, JOHN PORK IS SEARCHING FOR {user.username}</>;
}
