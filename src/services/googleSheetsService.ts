
interface DealerData {
  dealer: string;
  service: string;
  zone: string;
  activeUsers: number;
  expiredUsers: number;
  timestamp?: string;
}

interface ActiveDealerData {
  dealer: string;
  service: string;
  zone: string;
  activeUsers: number;
  timestamp?: string;
}

interface ExpiredDealerData {
  dealer: string;
  service: string;
  zone: string;
  expiredUsers: number;
  timestamp?: string;
}

interface ZoneSummary {
  zone: string;
  service: string;
  totalActive: number;
  totalExpired: number;
}

interface Snapshot {
  id: string;
  date: string;
  timestamp: string;
  activeData: ActiveDealerData[];
  expiredData: ExpiredDealerData[];
  totalActive: number;
  totalExpired: number;
  dealerCount: number;
}

// Updated sheet ID from your provided URL
const SHEET_ID = "1FHdyd5Qac9OrAgZTmoR0RtFNdqm1FoC8hXDhfoFDAGU";
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

// Find column indices based on header row
const findColumnIndices = (headers: string[]) => {
  const indices = {
    aDealers: -1,
    aService: -1,
    activeUsers: -1,
    aZone: -1,
    eDealers: -1,
    eService: -1,
    expiredUsers: -1,
    eZone: -1
  };

  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();
    if (normalizedHeader.includes('a-dealers') || normalizedHeader === 'a-dealers') {
      indices.aDealers = index;
    } else if (normalizedHeader.includes('a-service') || normalizedHeader === 'a-service') {
      indices.aService = index;
    } else if (normalizedHeader.includes('active users') || normalizedHeader === 'active users') {
      indices.activeUsers = index;
    } else if (normalizedHeader.includes('a-zone') || normalizedHeader === 'a-zone') {
      indices.aZone = index;
    } else if (normalizedHeader.includes('e-dealers') || normalizedHeader === 'e-dealers') {
      indices.eDealers = index;
    } else if (normalizedHeader.includes('e-service') || normalizedHeader === 'e-service') {
      indices.eService = index;
    } else if (normalizedHeader.includes('expired users') || normalizedHeader === 'expired users') {
      indices.expiredUsers = index;
    } else if (normalizedHeader.includes('e-zone') || normalizedHeader === 'e-zone') {
      indices.eZone = index;
    }
  });

  return indices;
};

// Fetch and parse active users data
export const fetchActiveUsersData = async (): Promise<ActiveDealerData[]> => {
  try {
    const response = await fetch(CSV_URL + '&_=' + Date.now());
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) return [];
    
    const headers = rows[0];
    const indices = findColumnIndices(headers);
    const data: ActiveDealerData[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < Math.max(...Object.values(indices))) continue;
      
      const dealer = row[indices.aDealers] || '';
      const service = row[indices.aService] || '';
      const zone = row[indices.aZone] || '';
      const activeUsers = parseInt(row[indices.activeUsers]) || 0;
      
      if (service && dealer && !service.toLowerCase().includes('zong') && 
          (service.toLowerCase().includes('tes') || service.toLowerCase().includes('mcsol'))) {
        data.push({
          dealer: dealer.trim(),
          service: service.trim(),
          zone: zone.trim(),
          activeUsers,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching active users data:', error);
    throw new Error('Failed to fetch active users data from Google Sheets');
  }
};

// Fetch and parse expired users data
export const fetchExpiredUsersData = async (): Promise<ExpiredDealerData[]> => {
  try {
    const response = await fetch(CSV_URL + '&_=' + Date.now());
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) return [];
    
    const headers = rows[0];
    const indices = findColumnIndices(headers);
    const data: ExpiredDealerData[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < Math.max(...Object.values(indices))) continue;
      
      const dealer = row[indices.eDealers] || '';
      const service = row[indices.eService] || '';
      const zone = row[indices.eZone] || '';
      const expiredUsers = parseInt(row[indices.expiredUsers]) || 0;
      
      if (service && dealer && !service.toLowerCase().includes('zong') && 
          (service.toLowerCase().includes('tes') || service.toLowerCase().includes('mcsol'))) {
        data.push({
          dealer: dealer.trim(),
          service: service.trim(),
          zone: zone.trim(),
          expiredUsers,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching expired users data:', error);
    throw new Error('Failed to fetch expired users data from Google Sheets');
  }
};

// Create a snapshot of current data
export const createSnapshot = async (): Promise<Snapshot> => {
  try {
    const [activeData, expiredData] = await Promise.all([
      fetchActiveUsersData(),
      fetchExpiredUsersData()
    ]);
    
    const now = new Date();
    const snapshot: Snapshot = {
      id: `snapshot_${now.getTime()}`,
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      activeData,
      expiredData,
      totalActive: activeData.reduce((sum, d) => sum + d.activeUsers, 0),
      totalExpired: expiredData.reduce((sum, d) => sum + d.expiredUsers, 0),
      dealerCount: new Set([...activeData.map(d => d.dealer), ...expiredData.map(d => d.dealer)]).size
    };
    
    // Store snapshot in localStorage (in production, this would be a database)
    storeSnapshot(snapshot);
    
    return snapshot;
  } catch (error) {
    console.error('Error creating snapshot:', error);
    throw new Error('Failed to create snapshot');
  }
};

// Store snapshot in localStorage
const storeSnapshot = (snapshot: Snapshot): void => {
  const snapshots = getStoredSnapshots();
  snapshots[snapshot.id] = snapshot;
  localStorage.setItem('dashboardSnapshots', JSON.stringify(snapshots));
  
  // Also update the historical data format for backward compatibility
  const historicalData = JSON.parse(localStorage.getItem('historicalData') || '{}');
  historicalData[snapshot.date] = {
    active: snapshot.activeData,
    expired: snapshot.expiredData,
    timestamp: snapshot.timestamp
  };
  localStorage.setItem('historicalData', JSON.stringify(historicalData));
};

// Get all stored snapshots
const getStoredSnapshots = (): Record<string, Snapshot> => {
  try {
    return JSON.parse(localStorage.getItem('dashboardSnapshots') || '{}');
  } catch (error) {
    console.error('Error parsing snapshots:', error);
    return {};
  }
};

// Get snapshots by date
export const getSnapshotsByDate = (date: string): Snapshot[] => {
  const snapshots = getStoredSnapshots();
  return Object.values(snapshots).filter(snapshot => snapshot.date === date);
};

// Get latest snapshot for a date
export const getLatestSnapshotForDate = (date: string): Snapshot | null => {
  const snapshots = getSnapshotsByDate(date);
  if (snapshots.length === 0) return null;
  
  return snapshots.reduce((latest, current) => 
    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
  );
};

// Get all available snapshot dates
export const getAvailableSnapshotDates = (): string[] => {
  const snapshots = getStoredSnapshots();
  const dates = new Set(Object.values(snapshots).map(s => s.date));
  return Array.from(dates).sort().reverse();
};

// Compare two snapshots
export const compareSnapshots = (snapshot1: Snapshot, snapshot2: Snapshot) => {
  const comparison = {
    date1: snapshot1.date,
    date2: snapshot2.date,
    activeUsersDiff: snapshot1.totalActive - snapshot2.totalActive,
    expiredUsersDiff: snapshot1.totalExpired - snapshot2.totalExpired,
    dealerCountDiff: snapshot1.dealerCount - snapshot2.dealerCount,
    zoneSummaryComparison: []
  };
  
  return comparison;
};

// Legacy function for backward compatibility - combines both active and expired data
export const fetchSheetData = async (): Promise<DealerData[]> => {
  try {
    const [activeData, expiredData] = await Promise.all([
      fetchActiveUsersData(),
      fetchExpiredUsersData()
    ]);
    
    const combinedData: DealerData[] = [];
    const dealerMap = new Map<string, DealerData>();
    
    activeData.forEach(item => {
      const key = `${item.dealer}-${item.service}`;
      dealerMap.set(key, {
        dealer: item.dealer,
        service: item.service,
        zone: item.zone,
        activeUsers: item.activeUsers,
        expiredUsers: 0,
        timestamp: item.timestamp
      });
    });
    
    expiredData.forEach(item => {
      const key = `${item.dealer}-${item.service}`;
      if (dealerMap.has(key)) {
        dealerMap.get(key)!.expiredUsers = item.expiredUsers;
      } else {
        dealerMap.set(key, {
          dealer: item.dealer,
          service: item.service,
          zone: item.zone,
          activeUsers: 0,
          expiredUsers: item.expiredUsers,
          timestamp: item.timestamp
        });
      }
    });
    
    return Array.from(dealerMap.values());
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error('Failed to fetch data from Google Sheets');
  }
};

// Get zone summaries for active users
export const getActiveZoneSummaries = (data: ActiveDealerData[]): ZoneSummary[] => {
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
  });
  
  return Array.from(summaries.values());
};

// Get zone summaries for expired users
export const getExpiredZoneSummaries = (data: ExpiredDealerData[]): ZoneSummary[] => {
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
    summary.totalExpired += dealer.expiredUsers;
  });
  
  return Array.from(summaries.values());
};

// Legacy function for backward compatibility
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
export const getHighExpiredDealers = (data: ExpiredDealerData[]): ExpiredDealerData[] => {
  return data.filter(dealer => dealer.expiredUsers >= 30);
};

// Store historical data in localStorage (will be replaced with proper database later)
export const storeHistoricalData = (activeData: ActiveDealerData[], expiredData: ExpiredDealerData[]): void => {
  const today = new Date().toISOString().split('T')[0];
  const historicalData = JSON.parse(localStorage.getItem('historicalData') || '{}');
  historicalData[today] = {
    active: activeData,
    expired: expiredData,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('historicalData', JSON.stringify(historicalData));
};

// Get historical data for a specific date
export const getHistoricalData = (date: string): { active: ActiveDealerData[], expired: ExpiredDealerData[] } | null => {
  const historicalData = JSON.parse(localStorage.getItem('historicalData') || '{}');
  return historicalData[date] || null;
};

// Get all available historical dates
export const getAvailableDates = (): string[] => {
  const historicalData = JSON.parse(localStorage.getItem('historicalData') || '{}');
  return Object.keys(historicalData).sort().reverse();
};

// Auto-refresh setup with 30-second polling
let pollingInterval: NodeJS.Timeout | null = null;

export const startAutoRefresh = (callback: () => void, intervalMs: number = 30000) => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  pollingInterval = setInterval(() => {
    console.log('Auto-refreshing data from Google Sheets...');
    callback();
  }, intervalMs);
  
  return pollingInterval;
};

export const stopAutoRefresh = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

// Export types for use in components
export type { DealerData, ActiveDealerData, ExpiredDealerData, ZoneSummary, Snapshot };
