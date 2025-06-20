
interface SnapshotData {
  activeUsers: any[];
  expiredUsers: any[];
  timestamp: string;
  date: string;
  monthYear: string;
}

interface SnapshotMetadata {
  filename: string;
  timestamp: string;
  date: string;
  monthYear: string;
  size: number;
}

const SNAPSHOT_STORAGE_KEY = 'dashboard_snapshots';
const SNAPSHOT_METADATA_KEY = 'snapshot_metadata';

// Get current date in YYYY-MM-DD format
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get current month-year in YYYY-MM format
export const getCurrentMonthYear = (): string => {
  return new Date().toISOString().slice(0, 7);
};

// Generate snapshot filename
export const generateSnapshotFilename = (): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `${date}_${time}.json`;
};

// Save snapshot data
export const saveSnapshot = async (activeData: any[], expiredData: any[]): Promise<string> => {
  const timestamp = new Date().toISOString();
  const date = getCurrentDate();
  const monthYear = getCurrentMonthYear();
  const filename = generateSnapshotFilename();

  const snapshotData: SnapshotData = {
    activeUsers: activeData,
    expiredUsers: expiredData,
    timestamp,
    date,
    monthYear
  };

  // Get existing snapshots
  const existingSnapshots = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || '{}');
  const existingMetadata = JSON.parse(localStorage.getItem(SNAPSHOT_METADATA_KEY) || '[]');

  // Save snapshot
  existingSnapshots[filename] = snapshotData;
  localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(existingSnapshots));

  // Update metadata
  const metadata: SnapshotMetadata = {
    filename,
    timestamp,
    date,
    monthYear,
    size: JSON.stringify(snapshotData).length
  };
  existingMetadata.push(metadata);
  localStorage.setItem(SNAPSHOT_METADATA_KEY, JSON.stringify(existingMetadata));

  console.log(`Snapshot saved: ${filename}`);
  return filename;
};

// Get all snapshot metadata
export const getAllSnapshotMetadata = (): SnapshotMetadata[] => {
  const metadata = JSON.parse(localStorage.getItem(SNAPSHOT_METADATA_KEY) || '[]');
  return metadata.sort((a: SnapshotMetadata, b: SnapshotMetadata) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Get snapshot by filename
export const getSnapshotByFilename = (filename: string): SnapshotData | null => {
  const snapshots = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || '{}');
  return snapshots[filename] || null;
};

// Get snapshots by month-year
export const getSnapshotsByMonth = (monthYear: string): SnapshotData[] => {
  const snapshots = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || '{}');
  return Object.values(snapshots).filter((snapshot: any) => 
    snapshot.monthYear === monthYear
  );
};

// Get latest snapshot for a specific month
export const getLatestSnapshotForMonth = (monthYear: string): SnapshotData | null => {
  const monthSnapshots = getSnapshotsByMonth(monthYear);
  if (monthSnapshots.length === 0) return null;
  
  return monthSnapshots.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
};

// Get snapshot for first day of current month
export const getFirstDaySnapshot = (): SnapshotData | null => {
  const currentMonthYear = getCurrentMonthYear();
  const firstDay = `${currentMonthYear}-01`;
  
  const snapshots = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || '{}');
  const firstDaySnapshots = Object.values(snapshots).filter((snapshot: any) => 
    snapshot.date === firstDay
  );
  
  if (firstDaySnapshots.length === 0) return null;
  return firstDaySnapshots[0] as SnapshotData;
};

// Compare two snapshots
export const compareSnapshots = (current: SnapshotData, previous: SnapshotData) => {
  const comparison = {
    activeUsers: {
      increased: [] as any[],
      decreased: [] as any[],
      unchanged: [] as any[],
      new: [] as any[],
      removed: [] as any[]
    },
    expiredUsers: {
      increased: [] as any[],
      decreased: [] as any[],
      unchanged: [] as any[],
      new: [] as any[],
      removed: [] as any[]
    }
  };

  // Compare active users
  const currentActiveMap = new Map();
  current.activeUsers.forEach(dealer => {
    const key = `${dealer.dealer}-${dealer.service}`;
    currentActiveMap.set(key, dealer);
  });

  const previousActiveMap = new Map();
  previous.activeUsers.forEach(dealer => {
    const key = `${dealer.dealer}-${dealer.service}`;
    previousActiveMap.set(key, dealer);
  });

  // Analyze active users changes
  currentActiveMap.forEach((currentDealer, key) => {
    if (previousActiveMap.has(key)) {
      const previousDealer = previousActiveMap.get(key);
      const difference = currentDealer.activeUsers - previousDealer.activeUsers;
      
      if (difference > 0) {
        comparison.activeUsers.increased.push({
          ...currentDealer,
          previousCount: previousDealer.activeUsers,
          difference
        });
      } else if (difference < 0) {
        comparison.activeUsers.decreased.push({
          ...currentDealer,
          previousCount: previousDealer.activeUsers,
          difference
        });
      } else {
        comparison.activeUsers.unchanged.push(currentDealer);
      }
    } else {
      comparison.activeUsers.new.push(currentDealer);
    }
  });

  previousActiveMap.forEach((previousDealer, key) => {
    if (!currentActiveMap.has(key)) {
      comparison.activeUsers.removed.push(previousDealer);
    }
  });

  // Compare expired users (similar logic)
  const currentExpiredMap = new Map();
  current.expiredUsers.forEach(dealer => {
    const key = `${dealer.dealer}-${dealer.service}`;
    currentExpiredMap.set(key, dealer);
  });

  const previousExpiredMap = new Map();
  previous.expiredUsers.forEach(dealer => {
    const key = `${dealer.dealer}-${dealer.service}`;
    previousExpiredMap.set(key, dealer);
  });

  currentExpiredMap.forEach((currentDealer, key) => {
    if (previousExpiredMap.has(key)) {
      const previousDealer = previousExpiredMap.get(key);
      const difference = currentDealer.expiredUsers - previousDealer.expiredUsers;
      
      if (difference > 0) {
        comparison.expiredUsers.increased.push({
          ...currentDealer,
          previousCount: previousDealer.expiredUsers,
          difference
        });
      } else if (difference < 0) {
        comparison.expiredUsers.decreased.push({
          ...currentDealer,
          previousCount: previousDealer.expiredUsers,
          difference
        });
      } else {
        comparison.expiredUsers.unchanged.push(currentDealer);
      }
    } else {
      comparison.expiredUsers.new.push(currentDealer);
    }
  });

  previousExpiredMap.forEach((previousDealer, key) => {
    if (!currentExpiredMap.has(key)) {
      comparison.expiredUsers.removed.push(previousDealer);
    }
  });

  return comparison;
};

// Auto-save snapshot (should be called daily)
export const autoSaveSnapshot = async () => {
  try {
    // This would normally fetch from your Google Sheets service
    // For now, we'll use a placeholder
    const activeData = []; // Replace with actual data fetch
    const expiredData = []; // Replace with actual data fetch
    
    const filename = await saveSnapshot(activeData, expiredData);
    console.log(`Auto-snapshot saved: ${filename}`);
    return filename;
  } catch (error) {
    console.error('Failed to auto-save snapshot:', error);
    throw error;
  }
};

// Get available months from snapshots
export const getAvailableMonths = (): string[] => {
  const metadata = getAllSnapshotMetadata();
  const months = [...new Set(metadata.map(m => m.monthYear))];
  return months.sort((a, b) => b.localeCompare(a));
};

// Delete old snapshots (cleanup)
export const cleanupOldSnapshots = (daysToKeep: number = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const snapshots = JSON.parse(localStorage.getItem(SNAPSHOT_STORAGE_KEY) || '{}');
  const metadata = JSON.parse(localStorage.getItem(SNAPSHOT_METADATA_KEY) || '[]');
  
  const filesToKeep = metadata.filter((m: SnapshotMetadata) => 
    new Date(m.timestamp) > cutoffDate
  );
  
  const newSnapshots: any = {};
  filesToKeep.forEach((m: SnapshotMetadata) => {
    if (snapshots[m.filename]) {
      newSnapshots[m.filename] = snapshots[m.filename];
    }
  });
  
  localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(newSnapshots));
  localStorage.setItem(SNAPSHOT_METADATA_KEY, JSON.stringify(filesToKeep));
  
  console.log(`Cleaned up snapshots, kept ${filesToKeep.length} files`);
};
