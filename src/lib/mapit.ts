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

// Council types that handle rights of way (in priority order)
const ROW_AUTHORITY_TYPES = [
  'CTY',  // County Council
  'UTA',  // Unitary Authority
  'MTD',  // Metropolitan District
  'LBO',  // London Borough
  'NPA',  // National Park Authority
  'DIS',  // District Council
  'LGD',  // Local Government District (NI)
  'COI',  // Council (Scotland)
];

/**
 * Look up the responsible council for a given location
 */
export async function lookupCouncil(lat: number, lng: number): Promise<CouncilInfo | null> {
  try {
    const url = `https://mapit.mysociety.org/point/4326/${lng},${lat}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('MapIt API error:', response.status, response.statusText);
      return null;
    }

    const data: MapItResponse = await response.json();

    // Find the appropriate authority by priority
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

    return null;
  } catch (error) {
    console.error('Error looking up council:', error);
    return null;
  }
}

/**
 * Get the contact email for a council from the database
 */
export async function getCouncilEmail(councilName: string): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Try exact match first
    const { data, error } = await supabase
      .from('council_emails')
      .select('prow_email')
      .eq('council_name', councilName)
      .single();

    if (!error && data) {
      return data.prow_email;
    }

    // Try fuzzy match if exact match fails
    const { data: fuzzyData } = await supabase
      .from('council_emails')
      .select('prow_email')
      .ilike('council_name', `%${councilName}%`)
      .limit(1)
      .single();

    return fuzzyData?.prow_email || null;
  } catch (error) {
    console.error('Error fetching council email:', error);
    return null;
  }
}
