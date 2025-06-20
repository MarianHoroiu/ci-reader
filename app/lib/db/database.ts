import Dexie, { type Table } from 'dexie';

// Define the stored person interface
export interface StoredPerson {
  id: string;
  nume: string;
  prenume: string;
  cnp: string;
  data_nasterii: string;
  locul_nasterii: string;
  nationalitate: string;
  sex: string;
  domiciliu: string;
  tip_document: string;
  seria_buletin: string;
  numar_buletin: string;
  valabilitate: string;
  emis_de: string;
  data_eliberarii: string;
  timestamp: number;
}

// Database class extending Dexie
export class RomanianIDDatabase extends Dexie {
  // Define the table type
  persons!: Table<StoredPerson>;

  constructor() {
    super('RomanianIDDatabase');

    // Define schema
    this.version(1).stores({
      persons: 'id, cnp, nume, prenume, timestamp', // Primary key: id, Indexes: cnp, nume, prenume, timestamp
    });
  }
}

// Create and export database instance
export const db = new RomanianIDDatabase();
