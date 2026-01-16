/**
 * MapIt API integration for council lookup
 * https://mapit.mysociety.org/
 */

import type { CouncilInfo } from '@/types';

interface MapItArea {
  id: number;
  name: string;
  type: string;
  type_name: string;
  country: string;
  country_name: string;
}

interface MapItResponse {
  [key: string]: MapItArea;
}

// Council types that handle rights of way
const ROW_AUTHORITY_TYPES = [
  'CTY',  // County Council
  'UTA',  // Unitary Authority
  'MTD',  // Metropolitan District
  'LBO',  // London Borough
  'NPA',  // National Park Authority
];

/**
 * Look up the responsible council for a given location
 * Returns the council that handles rights of way for that area
 */
export async function lookupCouncil(lat: number, lng: number): Promise<CouncilInfo | null> {
  try {
    // MapIt expects lng,lat order
    const url = `https://mapit.mysociety.org/point/4326/${lng},${lat}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('MapIt API error:', response.status, response.statusText);
      return null;
    }

    const data: MapItResponse = await response.json();

    // Find the appropriate authority for rights of way
    // Priority: County Council > Unitary Authority > Metropolitan District > London Borough > National Park
    for (const type of ROW_AUTHORITY_TYPES) {
      for (const area of Object.values(data)) {
        if (area.type === type) {
          return {
            id: area.id,
            name: area.name,
            type: area.type,
            type_name: area.type_name,
            country: area.country,
            country_name: area.country_name,
          };
        }
      }
    }

    // If no specific ROW authority found, return the most local authority
    const localTypes = ['DIS', 'LGD', 'COI']; // District, Local Government District, Council
    for (const type of localTypes) {
      for (const area of Object.values(data)) {
        if (area.type === type) {
          return {
            id: area.id,
            name: area.name,
            type: area.type,
            type_name: area.type_name,
            country: area.country,
            country_name: area.country_name,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error looking up council:', error);
    return null;
  }
}

/**
 * Get common council email formats
 * Note: These are patterns - actual emails should be verified
 */
export function getCouncilEmailPatterns(councilName: string): string[] {
  const slug = councilName
    .toLowerCase()
    .replace(/\s+council$/i, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z]/g, '');

  return [
    `prow@${slug}.gov.uk`,
    `publicrightsofway@${slug}.gov.uk`,
    `rightsofway@${slug}.gov.uk`,
    `highways@${slug}.gov.uk`,
    `countryside@${slug}.gov.uk`,
    `footpaths@${slug}.gov.uk`,
  ];
}

/**
 * Known council contact emails for rights of way
 * This would ideally be stored in a database and maintained
 */
const KNOWN_COUNCIL_EMAILS: Record<string, string> = {
  'Derbyshire County Council': 'prow@derbyshire.gov.uk',
  'Devon County Council': 'publicrightsofway@devon.gov.uk',
  'Cornwall Council': 'publicrightsofway@cornwall.gov.uk',
  'Kent County Council': 'prow@kent.gov.uk',
  'Hampshire County Council': 'countryside@hants.gov.uk',
  'Surrey County Council': 'countryside@surreycc.gov.uk',
  'Peak District National Park Authority': 'customer.service@peakdistrict.gov.uk',
  'Lake District National Park Authority': 'hq@lakedistrict.gov.uk',
  'Yorkshire Dales National Park Authority': 'info@yorkshiredales.org.uk',
  'Snowdonia National Park Authority': 'parc@eryri.llyw.cymru',
  // Add more as needed
};

/**
 * Get the contact email for a council
 */
export function getCouncilEmail(councilName: string): string | null {
  return KNOWN_COUNCIL_EMAILS[councilName] || null;
}
