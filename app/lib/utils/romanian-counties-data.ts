/**
 * Romanian Counties Data
 *
 * Comprehensive data about Romanian administrative divisions including:
 * - Counties with their codes and seats
 * - Municipalities (municipii) for each county
 * - Cities (orașe) for each county
 *
 * This data can be used to validate and cross-reference information extracted from
 * Romanian ID cards, particularly for address validation.
 */

/**
 * Romanian counties (județe) with their codes, seats, municipalities, and cities
 */
export interface RomanianCounty {
  name: string;
  code: string;
  seat: string;
  municipalities: string[];
  cities: string[];
}

export const ROMANIAN_COUNTIES: RomanianCounty[] = [
  {
    name: 'Alba',
    code: 'AB',
    seat: 'Alba Iulia',
    municipalities: ['Alba Iulia', 'Aiud', 'Blaj', 'Sebeș'],
    cities: ['Abrud', 'Câmpeni', 'Cugir', 'Ocna Mureș', 'Teiuș', 'Zlatna'],
  },
  {
    name: 'Arad',
    code: 'AR',
    seat: 'Arad',
    municipalities: ['Arad'],
    cities: [
      'Chișineu-Criș',
      'Curtici',
      'Ineu',
      'Lipova',
      'Nădlac',
      'Pâncota',
      'Pecica',
      'Sântana',
      'Sebiș',
    ],
  },
  {
    name: 'Argeș',
    code: 'AG',
    seat: 'Pitești',
    municipalities: ['Pitești', 'Câmpulung', 'Curtea de Argeș'],
    cities: ['Costești', 'Mioveni', 'Ștefănești', 'Topoloveni'],
  },
  {
    name: 'Bacău',
    code: 'BC',
    seat: 'Bacău',
    municipalities: ['Bacău', 'Onești', 'Moinești'],
    cities: [
      'Buhuși',
      'Comănești',
      'Dărmănești',
      'Slănic-Moldova',
      'Târgu Ocna',
    ],
  },
  {
    name: 'Bihor',
    code: 'BH',
    seat: 'Oradea',
    municipalities: ['Oradea', 'Beiuș', 'Marghita', 'Salonta'],
    cities: ['Aleșd', 'Nucet', 'Săcueni', 'Ștei', 'Valea lui Mihai'],
  },
  {
    name: 'Bistrița-Năsăud',
    code: 'BN',
    seat: 'Bistrița',
    municipalities: ['Bistrița'],
    cities: ['Beclean', 'Năsăud', 'Sângeorz-Băi'],
  },
  {
    name: 'Botoșani',
    code: 'BT',
    seat: 'Botoșani',
    municipalities: ['Botoșani', 'Dorohoi'],
    cities: ['Bucecea', 'Darabani', 'Flămânzi', 'Săveni', 'Ștefănești'],
  },
  {
    name: 'Brașov',
    code: 'BV',
    seat: 'Brașov',
    municipalities: ['Brașov', 'Făgăraș', 'Săcele', 'Codlea'],
    cities: ['Ghimbav', 'Predeal', 'Râșnov', 'Rupea', 'Victoria', 'Zărnești'],
  },
  {
    name: 'Brăila',
    code: 'BR',
    seat: 'Brăila',
    municipalities: ['Brăila'],
    cities: ['Făurei', 'Ianca', 'Însurăței'],
  },
  {
    name: 'București',
    code: 'B',
    seat: 'București',
    municipalities: ['București'],
    cities: [],
  },
  {
    name: 'Buzău',
    code: 'BZ',
    seat: 'Buzău',
    municipalities: ['Buzău', 'Râmnicu Sărat'],
    cities: ['Nehoiu', 'Pătârlagele', 'Pogoanele'],
  },
  {
    name: 'Caraș-Severin',
    code: 'CS',
    seat: 'Reșița',
    municipalities: ['Reșița', 'Caransebeș'],
    cities: [
      'Anina',
      'Băile Herculane',
      'Bocșa',
      'Moldova Nouă',
      'Oravița',
      'Oțelu Roșu',
    ],
  },
  {
    name: 'Călărași',
    code: 'CL',
    seat: 'Călărași',
    municipalities: ['Călărași', 'Oltenița'],
    cities: ['Budești', 'Fundulea', 'Lehliu Gară'],
  },
  {
    name: 'Cluj',
    code: 'CJ',
    seat: 'Cluj-Napoca',
    municipalities: ['Cluj-Napoca', 'Turda', 'Dej', 'Câmpia Turzii', 'Gherla'],
    cities: ['Huedin'],
  },
  {
    name: 'Constanța',
    code: 'CT',
    seat: 'Constanța',
    municipalities: ['Constanța', 'Medgidia', 'Mangalia'],
    cities: [
      'Băneasa',
      'Cernavodă',
      'Eforie',
      'Hârșova',
      'Murfatlar',
      'Năvodari',
      'Negru Vodă',
      'Ovidiu',
      'Techirghiol',
    ],
  },
  {
    name: 'Covasna',
    code: 'CV',
    seat: 'Sfântu Gheorghe',
    municipalities: ['Sfântu Gheorghe', 'Târgu Secuiesc'],
    cities: ['Baraolt', 'Covasna', 'Întorsura Buzăului'],
  },
  {
    name: 'Dâmbovița',
    code: 'DB',
    seat: 'Târgoviște',
    municipalities: ['Târgoviște', 'Moreni'],
    cities: ['Fieni', 'Găești', 'Pucioasa', 'Răcari', 'Titu'],
  },
  {
    name: 'Dolj',
    code: 'DJ',
    seat: 'Craiova',
    municipalities: ['Craiova', 'Băilești', 'Calafat'],
    cities: ['Bechet', 'Dăbuleni', 'Filiași', 'Segarcea'],
  },
  {
    name: 'Galați',
    code: 'GL',
    seat: 'Galați',
    municipalities: ['Galați', 'Tecuci'],
    cities: ['Berești', 'Târgu Bujor'],
  },
  {
    name: 'Giurgiu',
    code: 'GR',
    seat: 'Giurgiu',
    municipalities: ['Giurgiu'],
    cities: ['Bolintin-Vale', 'Mihăilești'],
  },
  {
    name: 'Gorj',
    code: 'GJ',
    seat: 'Târgu Jiu',
    municipalities: ['Târgu Jiu', 'Motru'],
    cities: [
      'Bumbești-Jiu',
      'Novaci',
      'Rovinari',
      'Târgu Cărbunești',
      'Tismana',
      'Turceni',
      'Țicleni',
    ],
  },
  {
    name: 'Harghita',
    code: 'HR',
    seat: 'Miercurea Ciuc',
    municipalities: [
      'Miercurea Ciuc',
      'Odorheiu Secuiesc',
      'Gheorgheni',
      'Toplița',
    ],
    cities: ['Bălan', 'Băile Tușnad', 'Borsec', 'Cristuru Secuiesc', 'Vlăhița'],
  },
  {
    name: 'Hunedoara',
    code: 'HD',
    seat: 'Deva',
    municipalities: [
      'Deva',
      'Hunedoara',
      'Brad',
      'Lupeni',
      'Orăștie',
      'Petroșani',
      'Vulcan',
    ],
    cities: [
      'Aninoasa',
      'Călan',
      'Geoagiu',
      'Hațeg',
      'Petrila',
      'Simeria',
      'Uricani',
    ],
  },
  {
    name: 'Ialomița',
    code: 'IL',
    seat: 'Slobozia',
    municipalities: ['Slobozia', 'Fetești', 'Urziceni'],
    cities: ['Amara', 'Căzănești', 'Fierbinți-Târg', 'Țăndărei'],
  },
  {
    name: 'Iași',
    code: 'IS',
    seat: 'Iași',
    municipalities: ['Iași', 'Pașcani'],
    cities: ['Hârlău', 'Podu Iloaiei', 'Târgu Frumos'],
  },
  {
    name: 'Ilfov',
    code: 'IF',
    seat: 'București',
    municipalities: [],
    cities: [
      'Bragadiru',
      'Buftea',
      'Chitila',
      'Măgurele',
      'Otopeni',
      'Pantelimon',
      'Popești-Leordeni',
      'Voluntari',
    ],
  },
  {
    name: 'Maramureș',
    code: 'MM',
    seat: 'Baia Mare',
    municipalities: ['Baia Mare', 'Sighetu Marmației'],
    cities: [
      'Baia Sprie',
      'Borșa',
      'Cavnic',
      'Dragomirești',
      'Săliștea de Sus',
      'Seini',
      'Șomcuta Mare',
      'Tăuții-Măgherăuș',
      'Târgu Lăpuș',
      'Ulmeni',
      'Vișeu de Sus',
    ],
  },
  {
    name: 'Mehedinți',
    code: 'MH',
    seat: 'Drobeta-Turnu Severin',
    municipalities: ['Drobeta-Turnu Severin', 'Orșova'],
    cities: ['Baia de Aramă', 'Strehaia', 'Vânju Mare'],
  },
  {
    name: 'Mureș',
    code: 'MS',
    seat: 'Târgu Mureș',
    municipalities: ['Târgu Mureș', 'Sighișoara', 'Reghin', 'Târnăveni'],
    cities: [
      'Iernut',
      'Luduș',
      'Miercurea Nirajului',
      'Sângeorgiu de Pădure',
      'Sărmașu',
      'Sovata',
      'Ungheni',
    ],
  },
  {
    name: 'Neamț',
    code: 'NT',
    seat: 'Piatra Neamț',
    municipalities: ['Piatra Neamț', 'Roman'],
    cities: ['Bicaz', 'Roznov', 'Târgu Neamț'],
  },
  {
    name: 'Olt',
    code: 'OT',
    seat: 'Slatina',
    municipalities: ['Slatina', 'Caracal'],
    cities: [
      'Balș',
      'Corabia',
      'Drăgănești-Olt',
      'Piatra-Olt',
      'Potcoava',
      'Scornicești',
    ],
  },
  {
    name: 'Prahova',
    code: 'PH',
    seat: 'Ploiești',
    municipalities: ['Ploiești', 'Câmpina'],
    cities: [
      'Azuga',
      'Băicoi',
      'Boldești-Scăeni',
      'Breaza',
      'Bușteni',
      'Comarnic',
      'Mizil',
      'Plopeni',
      'Sinaia',
      'Slănic',
      'Urlați',
      'Vălenii de Munte',
    ],
  },
  {
    name: 'Satu Mare',
    code: 'SM',
    seat: 'Satu Mare',
    municipalities: ['Satu Mare', 'Carei'],
    cities: ['Ardud', 'Livada', 'Negrești-Oaș', 'Tășnad'],
  },
  {
    name: 'Sălaj',
    code: 'SJ',
    seat: 'Zalău',
    municipalities: ['Zalău'],
    cities: ['Cehu Silvaniei', 'Jibou', 'Șimleu Silvaniei'],
  },
  {
    name: 'Sibiu',
    code: 'SB',
    seat: 'Sibiu',
    municipalities: ['Sibiu', 'Mediaș'],
    cities: [
      'Agnita',
      'Avrig',
      'Cisnădie',
      'Copșa Mică',
      'Dumbrăveni',
      'Miercurea Sibiului',
      'Ocna Sibiului',
      'Săliște',
      'Tălmaciu',
    ],
  },
  {
    name: 'Suceava',
    code: 'SV',
    seat: 'Suceava',
    municipalities: [
      'Suceava',
      'Fălticeni',
      'Rădăuți',
      'Câmpulung Moldovenesc',
      'Vatra Dornei',
    ],
    cities: [
      'Broșteni',
      'Cajvana',
      'Dolhasca',
      'Frasin',
      'Gura Humorului',
      'Liteni',
      'Milișăuți',
      'Salcea',
      'Siret',
      'Solca',
      'Vicovu de Sus',
    ],
  },
  {
    name: 'Teleorman',
    code: 'TR',
    seat: 'Alexandria',
    municipalities: ['Alexandria', 'Turnu Măgurele', 'Roșiorii de Vede'],
    cities: ['Videle', 'Zimnicea'],
  },
  {
    name: 'Timiș',
    code: 'TM',
    seat: 'Timișoara',
    municipalities: ['Timișoara', 'Lugoj'],
    cities: [
      'Buziaș',
      'Ciacova',
      'Deta',
      'Făget',
      'Gătaia',
      'Jimbolia',
      'Recaș',
      'Sânnicolau Mare',
    ],
  },
  {
    name: 'Tulcea',
    code: 'TL',
    seat: 'Tulcea',
    municipalities: ['Tulcea'],
    cities: ['Babadag', 'Isaccea', 'Măcin', 'Sulina'],
  },
  {
    name: 'Vaslui',
    code: 'VS',
    seat: 'Vaslui',
    municipalities: ['Vaslui', 'Bârlad', 'Huși'],
    cities: ['Murgeni', 'Negrești'],
  },
  {
    name: 'Vâlcea',
    code: 'VL',
    seat: 'Râmnicu Vâlcea',
    municipalities: ['Râmnicu Vâlcea', 'Drăgășani'],
    cities: [
      'Băbeni',
      'Băile Govora',
      'Băile Olănești',
      'Bălcești',
      'Berbești',
      'Brezoi',
      'Călimănești',
      'Horezu',
      'Ocnele Mari',
    ],
  },
  {
    name: 'Vrancea',
    code: 'VN',
    seat: 'Focșani',
    municipalities: ['Focșani', 'Adjud'],
    cities: ['Mărășești', 'Odobești', 'Panciu'],
  },
];

/**
 * Helper function to get a county by its code
 */
export function getCountyByCode(code: string): RomanianCounty | undefined {
  return ROMANIAN_COUNTIES.find(
    c => c.code.toUpperCase() === code.toUpperCase()
  );
}

/**
 * Helper function to check if a locality is in a county
 */
export function isLocalityInCounty(locality: string, county: string): boolean {
  const countyData = ROMANIAN_COUNTIES.find(
    c => c.name.toUpperCase() === county.toUpperCase()
  );

  if (!countyData) return false;

  const normalizedLocality = locality.toUpperCase();

  // Check municipalities
  if (
    countyData.municipalities.some(m => m.toUpperCase() === normalizedLocality)
  ) {
    return true;
  }

  // Check cities
  if (countyData.cities.some(c => c.toUpperCase() === normalizedLocality)) {
    return true;
  }

  return false;
}

/**
 * Helper function to check if a city is in a county
 */
export function isCityInCounty(city: string, county: string): boolean {
  const countyData = ROMANIAN_COUNTIES.find(
    c => c.name.toUpperCase() === county.toUpperCase()
  );

  if (!countyData) return false;

  const normalizedCity = city.toUpperCase();

  // Check municipalities
  if (countyData.municipalities.some(m => m.toUpperCase() === normalizedCity)) {
    return true;
  }

  // Check cities
  if (countyData.cities.some(c => c.toUpperCase() === normalizedCity)) {
    return true;
  }

  return false;
}

/**
 * Helper function to correct locality name (proper capitalization and diacritics)
 */
export function correctLocalityName(name: string): string {
  for (const county of ROMANIAN_COUNTIES) {
    // Check municipalities
    const municipality = county.municipalities.find(
      m => m.toUpperCase() === name.toUpperCase()
    );
    if (municipality) return municipality;

    // Check cities
    const city = county.cities.find(
      c => c.toUpperCase() === name.toUpperCase()
    );
    if (city) return city;
  }

  return name;
}

/**
 * Helper function to get all localities for a given county
 */
export function getAllLocalitiesByCounty(countyName: string): string[] {
  const countyData = ROMANIAN_COUNTIES.find(
    c => c.name.toUpperCase() === countyName.toUpperCase()
  );

  if (!countyData) return [];

  return [...countyData.municipalities, ...countyData.cities];
}
