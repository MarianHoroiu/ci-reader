import type { RomanianIDExtractionResult } from '@/lib/types/romanian-id-types';

export interface StoredPerson {
  id: string;
  timestamp: string;
  // Flattened Romanian ID fields
  nume: string | null;
  prenume: string | null;
  cnp: string | null;
  nationalitate: string | null;
  sex: string | null;
  data_nasterii: string | null;
  locul_nasterii: string | null;
  domiciliul: string | null;
  tip_document: string | null;
  seria: string | null;
  numar: string | null;
  data_eliberarii: string | null;
  valabil_pana_la: string | null;
  eliberat_de: string | null;
}

const STORAGE_KEY = 'extractedPersons';

export const PersonStorage = {
  saveExtractedPerson(extractedData: RomanianIDExtractionResult): string {
    const id = `person-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const person: StoredPerson = {
      id,
      timestamp: new Date().toISOString(),
      // Flatten all fields from extractedData.fields
      nume: extractedData.fields.nume,
      prenume: extractedData.fields.prenume,
      cnp: extractedData.fields.cnp,
      nationalitate: extractedData.fields.nationalitate,
      sex: extractedData.fields.sex,
      data_nasterii: extractedData.fields.data_nasterii,
      locul_nasterii: extractedData.fields.locul_nasterii,
      domiciliul: extractedData.fields.domiciliul,
      tip_document: extractedData.fields.tip_document,
      seria: extractedData.fields.seria,
      numar: extractedData.fields.numar,
      data_eliberarii: extractedData.fields.data_eliberarii,
      valabil_pana_la: extractedData.fields.valabil_pana_la,
      eliberat_de: extractedData.fields.eliberat_de,
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

  updateStoredPerson(
    id: string,
    extractedData: RomanianIDExtractionResult
  ): void {
    const stored = this.getStoredPersons();
    const personIndex = stored.findIndex(person => person.id === id);

    if (personIndex !== -1) {
      // Update existing person with new data and timestamp
      stored[personIndex] = {
        id, // Keep the same ID
        timestamp: new Date().toISOString(), // Update timestamp
        // Flatten all fields from extractedData.fields
        nume: extractedData.fields.nume,
        prenume: extractedData.fields.prenume,
        cnp: extractedData.fields.cnp,
        nationalitate: extractedData.fields.nationalitate,
        sex: extractedData.fields.sex,
        data_nasterii: extractedData.fields.data_nasterii,
        locul_nasterii: extractedData.fields.locul_nasterii,
        domiciliul: extractedData.fields.domiciliul,
        tip_document: extractedData.fields.tip_document,
        seria: extractedData.fields.seria,
        numar: extractedData.fields.numar,
        data_eliberarii: extractedData.fields.data_eliberarii,
        valabil_pana_la: extractedData.fields.valabil_pana_la,
        eliberat_de: extractedData.fields.eliberat_de,
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  },

  getPersonById(id: string): StoredPerson | null {
    const stored = this.getStoredPersons();
    return stored.find(person => person.id === id) || null;
  },

  findPersonByCNP(cnp: string | null): StoredPerson | null {
    if (!cnp || cnp.trim() === '') return null;
    const stored = this.getStoredPersons();
    return stored.find(person => person.cnp === cnp.trim()) || null;
  },
};
