import type { RomanianIDExtractionResult } from '@/lib/types/romanian-id-types';

export interface StoredPerson {
  id: string;
  timestamp: string;
  nume: string | null;
  prenume: string | null;
  fullData: RomanianIDExtractionResult;
}

const STORAGE_KEY = 'extractedPersons';

export const PersonStorage = {
  saveExtractedPerson(extractedData: RomanianIDExtractionResult): string {
    const id = `person-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const person: StoredPerson = {
      id,
      timestamp: new Date().toISOString(),
      nume: extractedData.fields.nume,
      prenume: extractedData.fields.prenume,
      fullData: extractedData,
    };

    const stored = this.getStoredPersons();
    stored.push(person);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return id;
  },

  getStoredPersons(): StoredPerson[] {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading stored persons:', error);
      return [];
    }
  },

  removeStoredPerson(id: string): void {
    const stored = this.getStoredPersons();
    const filtered = stored.filter(person => person.id !== id);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  clearAllPersons(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  },

  getPersonById(id: string): StoredPerson | null {
    const stored = this.getStoredPersons();
    return stored.find(person => person.id === id) || null;
  },
};
