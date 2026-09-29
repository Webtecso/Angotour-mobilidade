import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authApi, setToken, getToken } from '../services/api';

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
   * Verificacao de identidade (seccao 8-9 do documento de pesquisa): simula
   * o envio do BI + selfie de verificacao para analise. Numa fase seguinte
   * isto chama um endpoint real que liga ao Document Center do Admin
   * (seccao 74).
   */
  const submitIdentityVerification = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const current = userRef.current;
    if (!current) return;
    persistUser({ ...current, isVerified: true });
  };

  // AngoPoints: por agora guardados so no telemovel (o servidor ainda nao tem endpoint de pontos).
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

  const value = useMemo(
    () => ({
      user, isLoading, pendingPhone, requestOtp, verifyOtp, completeRegistration, signOut,
      submitIdentityVerification, addAngoPoints, spendAngoPoints,
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
