import AsyncStorage from '@react-native-async-storage/async-storage';
import { familyRemote } from './extrasApi';
import { syncQuiet, withTimeout } from './remoteSync';

const STORAGE_KEY = '@angotour/family_members';

export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

/**
 * Conta Familia (seccao 20 do documento): permite acompanhar viagens de
 * filhos e familiares. Por agora mock/local - numa fase seguinte cada membro
 * teria a sua propria conta ligada, com viagens visiveis ao administrador
 * da familia.
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  try {
    const remote = await withTimeout(familyRemote.list());
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
    return remote;
  } catch {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export async function addFamilyMember(name: string, phone: string, relationship: string): Promise<FamilyMember[]> {
  try {
    const updated = await withTimeout(familyRemote.add(name, phone, relationship));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    const all = await getFamilyMembers();
    const updated = [...all, { id: `fam-${Date.now()}`, name, phone, relationship }];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // falha ao gravar nao deve bloquear o fluxo
    }
    syncQuiet(() => familyRemote.add(name, phone, relationship));
    return updated;
  }
}

export async function removeFamilyMember(id: string): Promise<FamilyMember[]> {
  try {
    const updated = await withTimeout(familyRemote.remove(id));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    const all = await getFamilyMembers();
    const updated = all.filter((m) => m.id !== id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignora
    }
    syncQuiet(() => familyRemote.remove(id));
    return updated;
  }
}




