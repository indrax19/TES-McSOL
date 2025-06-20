
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, History, AlertTriangle, BarChart3 } from 'lucide-react';
import SnapshotManager from '@/components/SnapshotManager';
import SnapshotHistoryManager from '@/components/SnapshotHistoryManager';
import DashboardEnhancements from '@/components/DashboardEnhancements';

const SnapshotDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Snapshot Management Dashboard</h1>
        <p className="text-gray-600">
          Complete snapshot system with automatic daily captures, manual saves, and historical analysis
        </p>
      </div>

      <Tabs defaultValue="manager" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Snapshot Manager
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History Browser
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts & Analysis
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manager">
          <SnapshotManager />
        </TabsContent>

        <TabsContent value="history">
          <SnapshotHistoryManager />
        </TabsContent>

        <TabsContent value="alerts">
          <DashboardEnhancements />
        </TabsContent>

        <TabsContent value="automation">
          <DashboardEnhancements />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SnapshotDashboard;
