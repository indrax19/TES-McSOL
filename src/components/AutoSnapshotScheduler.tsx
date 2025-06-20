
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveSnapshot } from '@/services/snapshotService';
import { fetchActiveUsersData, fetchExpiredUsersData } from '@/services/googleSheetsService';

const AutoSnapshotScheduler = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastAutoSnapshot, setLastAutoSnapshot] = useState<string>('');
  const [nextScheduled, setNextScheduled] = useState<string>('');
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check if we should run auto-snapshot (once per day)
  const shouldRunAutoSnapshot = () => {
    const lastRun = localStorage.getItem('lastAutoSnapshotDate');
    const today = new Date().toISOString().split('T')[0];
    return lastRun !== today;
  };

  // Calculate next scheduled time (next day at same time)
  const calculateNextScheduled = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleString();
  };

  // Perform auto snapshot
  const performAutoSnapshot = async () => {
    try {
      const [activeData, expiredData] = await Promise.all([
        fetchActiveUsersData(),
        fetchExpiredUsersData()
      ]);

      const filename = await saveSnapshot(activeData, expiredData);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      localStorage.setItem('lastAutoSnapshotDate', today);
      setLastAutoSnapshot(now.toLocaleString());
      setNextScheduled(calculateNextScheduled());
      
      toast({
        title: "Auto-Snapshot Created",
        description: `Daily snapshot saved: ${filename}`,
      });
      
      console.log(`Auto-snapshot created: ${filename}`);
    } catch (error) {
      console.error('Auto-snapshot failed:', error);
      toast({
        title: "Auto-Snapshot Failed",
        description: "Failed to create automatic snapshot",
        variant: "destructive",
      });
    }
  };

  // Start auto-snapshot scheduler
  const startScheduler = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Check immediately if we need to run
    if (shouldRunAutoSnapshot()) {
      performAutoSnapshot();
    }

    // Set up interval to check every hour
    const newIntervalId = setInterval(() => {
      if (shouldRunAutoSnapshot()) {
        performAutoSnapshot();
      }
    }, 60 * 60 * 1000); // Check every hour

    setIntervalId(newIntervalId);
    setIsEnabled(true);
    setNextScheduled(calculateNextScheduled());
    
    toast({
      title: "Auto-Snapshot Enabled",
      description: "Daily snapshots will be created automatically",
    });
  };

  // Stop auto-snapshot scheduler
  const stopScheduler = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsEnabled(false);
    setNextScheduled('');
    
    toast({
      title: "Auto-Snapshot Disabled",
      description: "Automatic snapshots have been stopped",
    });
  };

  // Toggle scheduler
  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      startScheduler();
    } else {
      stopScheduler();
    }
  };

  // Initialize on component mount
  useEffect(() => {
    const lastRun = localStorage.getItem('lastAutoSnapshotDate');
    if (lastRun) {
      const lastDate = new Date(lastRun);
      setLastAutoSnapshot(lastDate.toLocaleString());
    }

    // Auto-start if it was previously enabled
    const wasEnabled = localStorage.getItem('autoSnapshotEnabled') === 'true';
    if (wasEnabled) {
      startScheduler();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Save enabled state to localStorage
  useEffect(() => {
    localStorage.setItem('autoSnapshotEnabled', isEnabled.toString());
  }, [isEnabled]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Auto-Snapshot Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="font-medium">Daily Auto-Snapshots</div>
            <div className="text-sm text-gray-500">
              Automatically create snapshots once per day
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Last Auto-Snapshot</span>
            </div>
            <div className="text-sm text-gray-600">
              {lastAutoSnapshot || 'Never'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Next Scheduled</span>
            </div>
            <div className="text-sm text-gray-600">
              {nextScheduled || 'Not scheduled'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Active' : 'Inactive'}
          </Badge>
          {isEnabled && (
            <Badge variant="outline">
              Checking hourly
            </Badge>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500">
            Auto-snapshots run once per day and help maintain historical data for comparisons and alerts.
            The system checks every hour to see if a daily snapshot is needed.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoSnapshotScheduler;
