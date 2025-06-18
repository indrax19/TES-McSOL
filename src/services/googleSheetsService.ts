
interface DealerData {
  dealer: string;
  service: string;
  zone: string;
  activeUsers: number;
  expiredUsers: number;
  timestamp?: string;
}

interface ZoneSummary {
  zone: string;
  service: string;
  totalActive: number;
  totalExpired: number;
}

const SHEET_ID = "1aJNdtlxXAi7i4DwavOQhY-5PsIQzwRFx9KFRhOW85J8";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Parse CSV data
const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n');
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
};

// Fetch data from Google Sheets
export const fetchSheetData = async (): Promise<DealerData[]> => {
  try {
    const response = await fetch(CSV_URL);
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    // Skip header row and parse data
    const data: DealerData[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 5) continue; // Skip incomplete rows
      
      const [dealer, service, zone, activeStr, expiredStr] = row;
      
      // Filter out Zong data - only include TES and McSOL
      if (service && (service.toLowerCase().includes('tes') || service.toLowerCase().includes('mcsol'))) {
        const activeUsers = parseInt(activeStr) || 0;
        const expiredUsers = parseInt(expiredStr) || 0;
        
        data.push({
          dealer: dealer || '',
          service: service || '',
          zone: zone || '',
          activeUsers,
          expiredUsers,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error('Failed to fetch data from Google Sheets');
  }
};

// Get zone summaries
export const getZoneSummaries = (data: DealerData[]): ZoneSummary[] => {
  const summaries = new Map<string, ZoneSummary>();
  
  data.forEach(dealer => {
    const key = `${dealer.zone}-${dealer.service}`;
    if (!summaries.has(key)) {
      summaries.set(key, {
        zone: dealer.zone,
        service: dealer.service,
        totalActive: 0,
        totalExpired: 0
      });
    }
    
    const summary = summaries.get(key)!;
    summary.totalActive += dealer.activeUsers;
    summary.totalExpired += dealer.expiredUsers;
  });
  
  return Array.from(summaries.values());
};

// Get dealers with 30+ expired users
export const getHighExpiredDealers = (data: DealerData[]): DealerData[] => {
  return data.filter(dealer => dealer.expiredUsers >= 30);
};

// Store historical data in localStorage
export const storeHistoricalData = (data: DealerData[]): void => {
  const today = new Date().toISOString().split('T')[0];
  const historicalData = JSON.parse(localStorage.getItem('historicalData') || '{}');
  historicalData[today] = data;
  localStorage.setItem('historicalData', JSON.stringify(historicalData));
};

// Get historical data for a specific date
export const getHistoricalData = (date: string): DealerData[] | null => {
  const historicalData = JSON.parse(localStorage.getItem('historicalData') || '{}');
  return historicalData[date] || null;
};

// Get all available historical dates
export const getAvailableDates = (): string[] => {
  const historicalData = JSON.parse(localStorage.getItem('historicalData') || '{}');
  return Object.keys(historicalData).sort().reverse();
};
