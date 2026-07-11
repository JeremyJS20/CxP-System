import { useContext } from 'react';
import { AuthContext } from '@/Presentation/Context/AuthContext';

export function useAuth() {
  return useContext(AuthContext);
}
