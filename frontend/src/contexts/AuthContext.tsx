import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api, { endpoints } from '../configs/Apis';
import { ApiError, errorMessage } from '../utils/api';
import { queryClient } from '../configs/queryClient';
import type { Envelope, User } from '../types/api';
type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .get<Envelope<User>>(endpoints.me, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setUser(data.data);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) setUser(null);
        else setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      queryClient.clear();
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    };
    window.addEventListener('pks:session-expired', expired);
    return () => window.removeEventListener('pks:session-expired', expired);
  }, []);
  const signIn = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<Envelope<User>>(endpoints.login, {
      email,
      password,
    });
    await queryClient.cancelQueries();
    queryClient.clear();
    setUser(data.data);
    setError(null);
    return data.data;
  }, []);
  const signOut = useCallback(async () => {
    await api.post(endpoints.logout);
    await queryClient.cancelQueries();
    queryClient.clear();
    // Keep the public route and session update in the same transition.
    startTransition(() => {
      navigate('/courses', { replace: true });
      setUser(null);
    });
  }, [navigate]);
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        retry: () => setAttempt((n) => n + 1),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
