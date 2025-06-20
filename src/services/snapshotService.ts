
import { ActiveDealerData, ExpiredDealerData } from './googleSheetsService';

export interface SnapshotData {
  activeUsers: ActiveDealerData[];
  expiredUsers: ExpiredDealerData[];
  timestamp: string;
  date: string;
  monthYear: string;
}

export interface SnapshotMetadata {
  filename: string;
  timestamp: string;
  date: string;
  monthYear: string;
  size: number;
}

export interface ComparisonResult {
  activeUsers: {
    increased: Array<ActiveDealerData & { difference: number; previousCount: number }>;
    decreased: Array<ActiveDealerData & { difference: number; previousCount: number }>;
    new: ActiveDealerData[];
    removed: ActiveDealerData[];
  };
  expiredUsers: {
    increased: Array<ExpiredDealerData & { difference: number; previousCount: number }>;
    decreased: Array<ExpiredDealerData & { difference: number; previousCount: number }>;
    new: ExpiredDealerData[];
    removed: ExpiredDealerData[];
  };
}

const SNAPSHOT_KEY_PREFIX = 'snapshot_';
const METADATA_KEY = 'snapshot_metadata';

export const saveSnapshot = async (activeData: ActiveDealerData[], expiredData: ExpiredDealerData[]): Promise<string> => {
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];
  const monthYear = date.slice(0, 7);
  const filename = `${date}_${timestamp.split('T')[1].slice(0, 5).replace(':', '-')}.json`;

  const snapshot: SnapshotData = {
    activeUsers: activeData,
    expiredUsers: expiredData,
    timestamp,
    date,
    monthYear
  };

  // Save snapshot data
  const snapshotKey = `${SNAPSHOT_KEY_PREFIX}${filename}`;
  localStorage.setItem(snapshotKey, JSON.stringify(snapshot));

  // Update metadata
  const metadata = getAllSnapshotMetadata();
  const newMetadata: SnapshotMetadata = {
    filename,
    timestamp,
    date,
    monthYear,
    size: JSON.stringify(snapshot).length
  };

  metadata.unshift(newMetadata);
  localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));

  console.log(`Snapshot saved: ${filename}`);
  return filename;
};

export const getAllSnapshotMetadata = (): SnapshotMetadata[] => {
  try {
    const metadata = localStorage.getItem(METADATA_KEY);
    return metadata ? JSON.parse(metadata) : [];
  } catch (error) {
    console.error('Error loading snapshot metadata:', error);
    return [];
  }
};

export const getSnapshotByFilename = (filename: string): SnapshotData | null => {
  try {
    const snapshotKey = `${SNAPSHOT_KEY_PREFIX}${filename}`;
    const snapshot = localStorage.getItem(snapshotKey);
    return snapshot ? JSON.parse(snapshot) : null;
  } catch (error) {
    console.error('Error loading snapshot:', error);
    return null;
  }
};

export const getSnapshotsByMonth = (monthYear: string): SnapshotData[] => {
  const metadata = getAllSnapshotMetadata();
  const monthSnapshots = metadata
    .filter(meta => meta.monthYear === monthYear)
    .map(meta => getSnapshotByFilename(meta.filename))
    .filter((snapshot): snapshot is SnapshotData => snapshot !== null);

  return monthSnapshots;
};

export const getFirstDaySnapshot = (): SnapshotData | null => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const firstDayDate = `${currentMonth}-01`;
  
  const metadata = getAllSnapshotMetadata();
  const firstDaySnapshot = metadata.find(meta => meta.date === firstDayDate);
  
  if (firstDaySnapshot) {
    return getSnapshotByFilename(firstDaySnapshot.filename);
  }
  
  return null;
};

export const compareSnapshots = (current: SnapshotData, previous: SnapshotData): ComparisonResult => {
  const compareArrays = <T extends { dealer: string; service: string; zone: string }>(
    currentArray: T[],
    previousArray: T[],
    countKey: keyof T
  ) => {
    const increased: Array<T & { difference: number; previousCount: number }> = [];
    const decreased: Array<T & { difference: number; previousCount: number }> = [];
    const newItems: T[] = [];
    const removed: T[] = [];

    currentArray.forEach(currentItem => {
      const previousItem = previousArray.find(
        p => p.dealer === currentItem.dealer && 
            p.service === currentItem.service && 
            p.zone === currentItem.zone
      );

      if (previousItem) {
        const currentCount = Number(currentItem[countKey]);
        const previousCount = Number(previousItem[countKey]);
        const difference = currentCount - previousCount;

        if (difference > 0) {
          increased.push({ ...currentItem, difference, previousCount });
        } else if (difference < 0) {
          decreased.push({ ...currentItem, difference, previousCount });
        }
      } else {
        newItems.push(currentItem);
      }
    });

    previousArray.forEach(previousItem => {
      const exists = currentArray.find(
        c => c.dealer === previousItem.dealer && 
            c.service === previousItem.service && 
            c.zone === previousItem.zone
      );
      if (!exists) {
        removed.push(previousItem);
      }
    });

    return { increased, decreased, new: newItems, removed };
  };

  return {
    activeUsers: compareArrays(current.activeUsers, previous.activeUsers, 'activeUsers'),
    expiredUsers: compareArrays(current.expiredUsers, previous.expiredUsers, 'expiredUsers')
  };
};

export const cleanupOldSnapshots = (daysToKeep: number = 90): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const metadata = getAllSnapshotMetadata();
  const toKeep = metadata.filter(meta => meta.date >= cutoffDateStr);
  const toDelete = metadata.filter(meta => meta.date < cutoffDateStr);

  // Delete old snapshots
  toDelete.forEach(meta => {
    const snapshotKey = `${SNAPSHOT_KEY_PREFIX}${meta.filename}`;
    localStorage.removeItem(snapshotKey);
  });

  // Update metadata
  localStorage.setItem(METADATA_KEY, JSON.stringify(toKeep));

  console.log(`Cleanup complete: Removed ${toDelete.length} old snapshots`);
};

export const getAvailableMonths = (): string[] => {
  const metadata = getAllSnapshotMetadata();
  const months = Array.from(new Set(metadata.map(meta => meta.monthYear)));
  return months.sort().reverse();
};
