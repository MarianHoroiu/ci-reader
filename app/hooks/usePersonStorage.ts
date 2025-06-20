import { useLiveQuery } from 'dexie-react-hooks';
import { PersonStorageService } from '@/lib/services/person-storage';
import { type StoredPerson } from '@/lib/db/database';
import type { RomanianIDExtractionResult } from '@/lib/types/romanian-id-types';

export function usePersonStorage() {
  // Live query for all persons - automatically updates when data changes
  const persons =
    useLiveQuery(() => PersonStorageService.getAllPersons()) ?? [];

  // Live query for persons count
  const personsCount =
    useLiveQuery(() => PersonStorageService.getPersonsCount()) ?? 0;

  // Add person from AI extraction result
  const addPersonFromExtraction = async (
    extractedData: RomanianIDExtractionResult
  ) => {
    try {
      const id =
        await PersonStorageService.addPersonFromExtraction(extractedData);
      return { success: true, id };
    } catch (error) {
      console.error('Failed to add person from extraction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Add person function
  const addPerson = async (
    personData: Omit<StoredPerson, 'id' | 'timestamp'>
  ) => {
    try {
      const id = await PersonStorageService.addPerson(personData);
      return { success: true, id };
    } catch (error) {
      console.error('Failed to add person:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Update person function
  const updatePerson = async (
    id: string,
    updates: Partial<Omit<StoredPerson, 'id'>>
  ) => {
    try {
      await PersonStorageService.updatePerson(id, updates);
      return { success: true };
    } catch (error) {
      console.error('Failed to update person:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Delete person function
  const deletePerson = async (id: string) => {
    try {
      await PersonStorageService.deletePerson(id);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete person:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Clear all persons function
  const clearAllPersons = async () => {
    try {
      await PersonStorageService.clearAllPersons();
      return { success: true };
    } catch (error) {
      console.error('Failed to clear all persons:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Find person by CNP
  const findPersonByCNP = async (cnp: string) => {
    try {
      const person = await PersonStorageService.findPersonByCNP(cnp);
      return { success: true, person };
    } catch (error) {
      console.error('Failed to find person by CNP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Search persons by name
  const searchPersons = async (query: string) => {
    try {
      const results = await PersonStorageService.searchPersons(query);
      return { success: true, results };
    } catch (error) {
      console.error('Failed to search persons:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  return {
    // Data
    persons,
    personsCount,

    // Actions
    addPersonFromExtraction,
    addPerson,
    updatePerson,
    deletePerson,
    clearAllPersons,
    findPersonByCNP,
    searchPersons,
  };
}
