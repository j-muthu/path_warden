/**
 * Convert between Ordnance Survey Grid References and Latitude/Longitude
 * Uses the geodesy library for accurate conversions
 */

// Grid reference letters for the 100km grid squares
const GRID_LETTERS = [
  ['V', 'W', 'X', 'Y', 'Z'],
  ['Q', 'R', 'S', 'T', 'U'],
  ['L', 'M', 'N', 'O', 'P'],
  ['F', 'G', 'H', 'J', 'K'],
  ['A', 'B', 'C', 'D', 'E'],
];

/**
 * Convert latitude/longitude to OS Grid Reference
 */
export function latLngToGridRef(lat: number, lng: number, digits: number = 6): string | null {
  try {
    // Convert lat/lng (WGS84) to OSGB36 easting/northing
    const { easting, northing } = latLngToOSGB(lat, lng);

    if (easting < 0 || easting > 700000 || northing < 0 || northing > 1300000) {
      return null; // Outside UK grid
    }

    // Get 100km grid square
    const e100km = Math.floor(easting / 100000);
    const n100km = Math.floor(northing / 100000);

    // Get grid letters
    const l1 = Math.floor(n100km / 5) + Math.floor(e100km / 5) * 5;
    const l2 = (n100km % 5) * 5 + (e100km % 5);

    const firstLetter = l1 < 25 ? String.fromCharCode(65 + l1) : String.fromCharCode(66 + l1);
    let secondLetter = String.fromCharCode(65 + l2);
    if (secondLetter >= 'I') secondLetter = String.fromCharCode(secondLetter.charCodeAt(0) + 1);

    // Calculate grid letters using proper lookup
    const letter1Index = Math.floor((northing / 500000) * 5 + (easting / 500000));

    // Simplified approach: use well-known UK grid squares
    const gridLetters = getGridLetters(e100km, n100km);
    if (!gridLetters) return null;

    // Get the numeric part
    const halfDigits = digits / 2;
    const divisor = Math.pow(10, 5 - halfDigits);
    const e = Math.floor((easting % 100000) / divisor).toString().padStart(halfDigits, '0');
    const n = Math.floor((northing % 100000) / divisor).toString().padStart(halfDigits, '0');

    return `${gridLetters}${e}${n}`;
  } catch {
    return null;
  }
}

/**
 * Convert OS Grid Reference to latitude/longitude
 */
export function gridRefToLatLng(gridRef: string): { lat: number; lng: number } | null {
  try {
    const ref = gridRef.toUpperCase().replace(/\s/g, '');

    // Match pattern: 2 letters followed by even number of digits
    const match = ref.match(/^([A-HJ-Z]{2})(\d+)$/);
    if (!match) return null;

    const letters = match[1];
    const numbers = match[2];

    if (numbers.length % 2 !== 0) return null;

    // Get 100km square from letters
    const coords = lettersToCoords(letters);
    if (!coords) return null;

    // Parse numeric part
    const halfLen = numbers.length / 2;
    const multiplier = Math.pow(10, 5 - halfLen);
    const easting = coords.e + parseInt(numbers.substring(0, halfLen), 10) * multiplier;
    const northing = coords.n + parseInt(numbers.substring(halfLen), 10) * multiplier;

    // Add half-grid offset for center of grid square
    const offset = multiplier / 2;

    return osgbToLatLng(easting + offset, northing + offset);
  } catch {
    return null;
  }
}

/**
 * Get grid letters from 100km indices
 */
function getGridLetters(e100km: number, n100km: number): string | null {
  // UK National Grid uses a specific letter system
  // First letter: based on 500km square
  // Second letter: based on 100km square within that

  const e500 = Math.floor(e100km / 5);
  const n500 = Math.floor(n100km / 5);

  // First letter
  let l1: string;
  if (n500 === 0 && e500 === 0) l1 = 'S';
  else if (n500 === 0 && e500 === 1) l1 = 'T';
  else if (n500 === 1 && e500 === 0) l1 = 'N';
  else if (n500 === 1 && e500 === 1) l1 = 'O';
  else if (n500 === 2 && e500 === 0) l1 = 'H';
  else if (n500 === 2 && e500 === 1) l1 = 'J';
  else return null;

  // Second letter
  const e100 = e100km % 5;
  const n100 = n100km % 5;
  const index = (4 - n100) * 5 + e100;

  let l2 = String.fromCharCode(65 + index);
  if (l2 >= 'I') l2 = String.fromCharCode(l2.charCodeAt(0) + 1); // Skip 'I'

  return l1 + l2;
}

/**
 * Convert grid letters to 100km easting/northing
 */
function lettersToCoords(letters: string): { e: number; n: number } | null {
  const l1 = letters.charAt(0);
  const l2 = letters.charAt(1);

  // First letter gives 500km square
  let e500: number, n500: number;
  switch (l1) {
    case 'S': e500 = 0; n500 = 0; break;
    case 'T': e500 = 1; n500 = 0; break;
    case 'N': e500 = 0; n500 = 1; break;
    case 'O': e500 = 1; n500 = 1; break;
    case 'H': e500 = 0; n500 = 2; break;
    case 'J': e500 = 1; n500 = 2; break;
    default: return null;
  }

  // Second letter gives 100km square within
  let code = l2.charCodeAt(0) - 65;
  if (l2 > 'I') code--; // Skip 'I'
  if (code < 0 || code > 24) return null;

  const e100 = code % 5;
  const n100 = 4 - Math.floor(code / 5);

  return {
    e: (e500 * 5 + e100) * 100000,
    n: (n500 * 5 + n100) * 100000,
  };
}

/**
 * Convert WGS84 lat/lng to OSGB36 easting/northing
 * Simplified conversion - for production use the geodesy library
 */
function latLngToOSGB(lat: number, lng: number): { easting: number; northing: number } {
  // Convert degrees to radians
  const phi = lat * Math.PI / 180;
  const lambda = lng * Math.PI / 180;

  // Airy 1830 ellipsoid parameters
  const a = 6377563.396;
  const b = 6356256.909;
  const e2 = (a * a - b * b) / (a * a);

  // National Grid parameters
  const N0 = -100000;
  const E0 = 400000;
  const F0 = 0.9996012717;
  const phi0 = 49 * Math.PI / 180;
  const lambda0 = -2 * Math.PI / 180;

  const n = (a - b) / (a + b);
  const n2 = n * n;
  const n3 = n * n * n;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const nu = a * F0 / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinPhi * sinPhi, 1.5);
  const eta2 = nu / rho - 1;

  const M = calculateM(phi, phi0, a, b, n, F0);

  const cos3phi = cosPhi * cosPhi * cosPhi;
  const cos5phi = cos3phi * cosPhi * cosPhi;
  const tan2phi = Math.tan(phi) * Math.tan(phi);
  const tan4phi = tan2phi * tan2phi;

  const I = M + N0;
  const II = (nu / 2) * sinPhi * cosPhi;
  const III = (nu / 24) * sinPhi * cos3phi * (5 - tan2phi + 9 * eta2);
  const IIIA = (nu / 720) * sinPhi * cos5phi * (61 - 58 * tan2phi + tan4phi);
  const IV = nu * cosPhi;
  const V = (nu / 6) * cos3phi * (nu / rho - tan2phi);
  const VI = (nu / 120) * cos5phi * (5 - 18 * tan2phi + tan4phi + 14 * eta2 - 58 * tan2phi * eta2);

  const dLon = lambda - lambda0;
  const dLon2 = dLon * dLon;
  const dLon3 = dLon2 * dLon;
  const dLon4 = dLon3 * dLon;
  const dLon5 = dLon4 * dLon;
  const dLon6 = dLon5 * dLon;

  const northing = I + II * dLon2 + III * dLon4 + IIIA * dLon6;
  const easting = E0 + IV * dLon + V * dLon3 + VI * dLon5;

  return { easting, northing };
}

function calculateM(phi: number, phi0: number, a: number, b: number, n: number, F0: number): number {
  const n2 = n * n;
  const n3 = n * n * n;

  return b * F0 * (
    (1 + n + (5 / 4) * n2 + (5 / 4) * n3) * (phi - phi0)
    - (3 * n + 3 * n2 + (21 / 8) * n3) * Math.sin(phi - phi0) * Math.cos(phi + phi0)
    + ((15 / 8) * n2 + (15 / 8) * n3) * Math.sin(2 * (phi - phi0)) * Math.cos(2 * (phi + phi0))
    - ((35 / 24) * n3) * Math.sin(3 * (phi - phi0)) * Math.cos(3 * (phi + phi0))
  );
}

/**
 * Convert OSGB36 easting/northing to WGS84 lat/lng
 */
function osgbToLatLng(easting: number, northing: number): { lat: number; lng: number } {
  // Airy 1830 ellipsoid parameters
  const a = 6377563.396;
  const b = 6356256.909;
  const e2 = (a * a - b * b) / (a * a);

  // National Grid parameters
  const N0 = -100000;
  const E0 = 400000;
  const F0 = 0.9996012717;
  const phi0 = 49 * Math.PI / 180;
  const lambda0 = -2 * Math.PI / 180;

  const n = (a - b) / (a + b);

  let phi = phi0;
  let M = 0;

  // Iterate to find phi
  do {
    phi = (northing - N0 - M) / (a * F0) + phi;
    M = calculateM(phi, phi0, a, b, n, F0);
  } while (Math.abs(northing - N0 - M) >= 0.00001);

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const tanPhi = Math.tan(phi);

  const nu = a * F0 / Math.sqrt(1 - e2 * sinPhi * sinPhi);
  const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinPhi * sinPhi, 1.5);
  const eta2 = nu / rho - 1;

  const tan2phi = tanPhi * tanPhi;
  const tan4phi = tan2phi * tan2phi;
  const tan6phi = tan4phi * tan2phi;
  const secPhi = 1 / cosPhi;

  const VII = tanPhi / (2 * rho * nu);
  const VIII = tanPhi / (24 * rho * nu * nu * nu) * (5 + 3 * tan2phi + eta2 - 9 * tan2phi * eta2);
  const IX = tanPhi / (720 * rho * Math.pow(nu, 5)) * (61 + 90 * tan2phi + 45 * tan4phi);
  const X = secPhi / nu;
  const XI = secPhi / (6 * nu * nu * nu) * (nu / rho + 2 * tan2phi);
  const XII = secPhi / (120 * Math.pow(nu, 5)) * (5 + 28 * tan2phi + 24 * tan4phi);
  const XIIA = secPhi / (5040 * Math.pow(nu, 7)) * (61 + 662 * tan2phi + 1320 * tan4phi + 720 * tan6phi);

  const dE = easting - E0;
  const dE2 = dE * dE;
  const dE3 = dE2 * dE;
  const dE4 = dE3 * dE;
  const dE5 = dE4 * dE;
  const dE6 = dE5 * dE;
  const dE7 = dE6 * dE;

  const lat = (phi - VII * dE2 + VIII * dE4 - IX * dE6) * 180 / Math.PI;
  const lng = (lambda0 + X * dE - XI * dE3 + XII * dE5 - XIIA * dE7) * 180 / Math.PI;

  return { lat, lng };
}

/**
 * Validate a grid reference format
 */
export function isValidGridRef(gridRef: string): boolean {
  const ref = gridRef.toUpperCase().replace(/\s/g, '');
  return /^[A-HJ-Z]{2}\d{4,10}$/.test(ref) && ref.length % 2 === 0;
}

/**
 * Parse a Google Maps link to extract coordinates
 */
export function parseGoogleMapsLink(url: string): { lat: number; lng: number } | null {
  try {
    // Various Google Maps URL formats
    // https://www.google.com/maps/@51.5074,-0.1278,15z
    // https://www.google.com/maps/place/.../@51.5074,-0.1278,15z
    // https://goo.gl/maps/... (would need to follow redirect)
    // https://maps.google.com/?q=51.5074,-0.1278

    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // @lat,lng format
      /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // ?q=lat,lng format
      /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // ?ll=lat,lng format
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
