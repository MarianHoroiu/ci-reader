import { db, type StoredPerson } from '@/lib/db/database';
import type { RomanianIDExtractionResult } from '@/lib/types/romanian-id-types';

export class PersonStorageService {
  // Add a new person to IndexedDB
  static async addPerson(
    person: Omit<StoredPerson, 'id' | 'timestamp'>
  ): Promise<string> {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const personWithMeta: StoredPerson = {
      ...person,
      id,
      timestamp: Date.now(),
    };

    await db.persons.add(personWithMeta);
    return id;
  }

  // Get all stored persons
  static async getAllPersons(): Promise<StoredPerson[]> {
    return await db.persons.orderBy('timestamp').reverse().toArray();
  }

  // Get a person by ID
  static async getPersonById(id: string): Promise<StoredPerson | undefined> {
    return await db.persons.get(id);
  }

  // Find a person by CNP
  static async findPersonByCNP(cnp: string): Promise<StoredPerson | undefined> {
    return await db.persons.where('cnp').equals(cnp).first();
  }

  // Update an existing person
  static async updatePerson(
    id: string,
    updates: Partial<Omit<StoredPerson, 'id'>>
  ): Promise<void> {
    await db.persons.update(id, {
      ...updates,
      timestamp: Date.now(), // Update timestamp when modifying
    });
  }

  // Delete a person by ID
  static async deletePerson(id: string): Promise<void> {
    await db.persons.delete(id);
  }

  // Clear all persons
  static async clearAllPersons(): Promise<void> {
    await db.persons.clear();
  }

  // Count total persons
  static async getPersonsCount(): Promise<number> {
    return await db.persons.count();
  }

  // Search persons by name (nume or prenume)
  static async searchPersons(query: string): Promise<StoredPerson[]> {
    const lowerQuery = query.toLowerCase();
    return await db.persons
      .filter(
        person =>
          person.nume.toLowerCase().includes(lowerQuery) ||
          person.prenume.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  // Add a new person from AI extraction result
  static async addPersonFromExtraction(
    extractedData: RomanianIDExtractionResult
  ): Promise<string> {
    const person: Omit<StoredPerson, 'id' | 'timestamp'> = {
      nume: extractedData.fields.nume || '',
      prenume: extractedData.fields.prenume || '',
      cnp: extractedData.fields.cnp || '',
      nationalitate: extractedData.fields.nationalitate || '',
      sex: extractedData.fields.sex || '',
      data_nasterii: extractedData.fields.data_nasterii || '',
      locul_nasterii: extractedData.fields.locul_nasterii || '',
      domiciliu: extractedData.fields.domiciliul || '', // Map domiciliul -> domiciliu
      tip_document: extractedData.fields.tip_document || '',
      seria_buletin: extractedData.fields.seria_buletin || '',
      numar_buletin: extractedData.fields.numar_buletin || '',
      valabilitate: extractedData.fields.valabil_pana_la || '', // Map valabil_pana_la -> valabilitate
      emis_de: extractedData.fields.eliberat_de || '', // Map eliberat_de -> emis_de
      data_eliberarii: extractedData.fields.data_eliberarii || '',
    };

    return await this.addPerson(person);
  }
}
