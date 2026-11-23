import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMyPoints } from '../services/backendApi';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authApi, setToken, getToken } from '../services/api';
import { profileRemote, pushRemote } from '../services/backendApi';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

const STORAGE_KEY = '@angotour/user';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  pendingPhone: string | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<{ isNewUser: boolean }>;
  completeRegistration: (data: Pick<User, 'fullName' | 'birthDate' | 'preferredLanguage'>) => Promise<void>;
  signOut: () => Promise<void>;
  submitIdentityVerification: () => Promise<void>;
  addAngoPoints: (points: number) => void;
  spendAngoPoints: (points: number) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => void;
  refreshPoints: () => Promise<boolean>;
  refreshProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (token && stored) setUser(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    registerForPushNotificationsAsync()
      .then((token) => { if (token) pushRemote.registerToken(token).catch(() => {}); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const persistUser = (updated: User) => {
    userRef.current = updated;
    setUser(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  };

  const requestOtp = async (phone: string) => {
    setPendingPhone(phone);
    await authApi.requestOtp(phone);
  };

  const verifyOtp = async (code: string): Promise<{ isNewUser: boolean }> => {
    if (!pendingPhone) throw new Error('Nenhum numero de telefone pendente.');

    const result = await authApi.verifyOtp(pendingPhone, code);

    if (result.isNewUser) {
      return { isNewUser: true };
    }

    await setToken(result.accessToken);
    // Perfil minimo por agora; sera enriquecido quando o endpoint /users/me existir.
    const minimalUser: User = {
      id: result.userId ?? '',
      fullName: '',
      phone: pendingPhone,
      preferredLanguage: 'pt',
      isVerified: false,
      angoPoints: 0,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(minimalUser));
    setUser(minimalUser);

    return { isNewUser: false };
  };

  const completeRegistration: AuthContextValue['completeRegistration'] = async (data) => {
    if (!pendingPhone) throw new Error('Nenhum numero de telefone pendente.');

    const result = await authApi.register({
      phone: pendingPhone,
      fullName: data.fullName,
      birthDate: data.birthDate,
      preferredLanguage: data.preferredLanguage ?? 'pt',
    });

    await setToken(result.accessToken);

    const newUser: User = {
      id: result.userId ?? '',
      phone: pendingPhone,
      fullName: data.fullName,
      birthDate: data.birthDate,
      preferredLanguage: data.preferredLanguage,
      isVerified: false,
      angoPoints: 0,
      createdAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const signOut = async () => {
    await setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setPendingPhone(null);
  };

  /**
   * Verificacao de identidade: o BI e a selfie ja foram enviados ao servidor pelo modal.
   * Aqui so se pede a revisao. NUNCA se auto-aprova: o servidor grava 'pending' e so um
   * revisor no painel aprova. Sem confirmacao do servidor, o erro sobe ate ao ecra.
   */
  const submitIdentityVerification = async (): Promise<void> => {
    const current = userRef.current;
    if (!current) return;
    // Sem confirmacao do servidor nao ha estado 'pending': o erro sobe ate ao ecra.
    const result = await profileRemote.verifyIdentity();
    persistUser({ ...current, isVerified: result.isVerified, verificationStatus: result.verificationStatus as User['verificationStatus'] });
  };

  // AngoPoints: o servidor e a fonte da verdade (GET /profile/me); aqui fica so uma copia para mostrar.
  const addAngoPoints = (points: number) => {
    const current = userRef.current;
    if (!current || points <= 0) return;
    persistUser({ ...current, angoPoints: current.angoPoints + points });
  };

  const spendAngoPoints = async (points: number): Promise<boolean> => {
    const current = userRef.current;
    if (!current || points <= 0 || current.angoPoints < points) return false;
    persistUser({ ...current, angoPoints: current.angoPoints - points });
    return true;
  };

  const updateProfile = (data: Partial<User>) => {
    const current = userRef.current;
    if (!current) return;
    persistUser({ ...current, ...data });
  };

  // Estado do perfil no servidor (selo de verificacao e pontos). Devolve false sem rede.
  const refreshProfile = async (): Promise<boolean> => {
    try {
      const p = await profileRemote.me();
      const current = userRef.current;
      if (!current) return false;
      const points = Number(p.angoPoints ?? 0);
      const status = p.verificationStatus as User['verificationStatus'];
      if (current.angoPoints !== points || current.isVerified !== !!p.isVerified || current.verificationStatus !== status) {
        persistUser({ ...current, angoPoints: points, isVerified: !!p.isVerified, verificationStatus: status });
      }
      return true;
    } catch {
      return false;
    }
  };

  // Ao voltar a app ao primeiro plano, relê o perfil (o revisor pode ter aprovado entretanto).
  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refreshProfile();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  // Os pontos vivem no servidor; devolve false se nao foi possivel ler (sem rede).
  const refreshPoints = async (): Promise<boolean> => {
    try {
      const points = await fetchMyPoints();
      const current = userRef.current;
      if (current && current.angoPoints !== points) persistUser({ ...current, angoPoints: points });
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (user) void refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!user]);

  const value = useMemo(
    () => ({
      user, isLoading, pendingPhone, requestOtp, verifyOtp, completeRegistration, signOut,
      submitIdentityVerification, addAngoPoints, spendAngoPoints, updateProfile, refreshPoints, refreshProfile,
    }),
    [user, isLoading, pendingPhone]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um <AuthProvider>');
  return ctx;
}
