
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import SnapshotManager from './SnapshotManager';
import ActiveUserAlerts from './ActiveUserAlerts';
import AutoSnapshotScheduler from './AutoSnapshotScheduler';
import { fetchActiveUsersData, fetchExpiredUsersData } from '@/services/googleSheetsService';

const DashboardEnhancements = () => {
  const { data: activeData = [] } = useQuery({
    queryKey: ['activeUsersData'],
    queryFn: fetchActiveUsersData,
    refetchInterval: 30000,
  });

  const { data: expiredData = [] } = useQuery({
    queryKey: ['expiredUsersData'],
    queryFn: fetchExpiredUsersData,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Dashboard Features</h2>
        <p className="text-gray-600">Snapshot management, alerts, and automated monitoring</p>
      </div>

      <Tabs defaultValue="snapshots" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="snapshots" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Snapshots
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snapshots">
          <SnapshotManager />
        </TabsContent>

        <TabsContent value="alerts">
          <ActiveUserAlerts 
            currentActiveData={activeData}
            currentExpiredData={expiredData}
          />
        </TabsContent>

        <TabsContent value="automation">
          <AutoSnapshotScheduler />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardEnhancements;
