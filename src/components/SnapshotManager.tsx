
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Calendar, FileText, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  saveSnapshot, 
  getAllSnapshotMetadata, 
  getSnapshotByFilename,
  cleanupOldSnapshots 
} from '@/services/snapshotService';
import { fetchActiveUsersData, fetchExpiredUsersData } from '@/services/googleSheetsService';

const SnapshotManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [snapshots, setSnapshots] = useState(getAllSnapshotMetadata());
  const { toast } = useToast();

  const handleCreateSnapshot = async () => {
    setIsCreating(true);
    try {
      const [activeData, expiredData] = await Promise.all([
        fetchActiveUsersData(),
        fetchExpiredUsersData()
      ]);

      const filename = await saveSnapshot(activeData, expiredData);
      setSnapshots(getAllSnapshotMetadata());
      
      toast({
        title: "Snapshot Created",
        description: `Successfully saved snapshot: ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create snapshot",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewSnapshot = (filename: string) => {
    const snapshot = getSnapshotByFilename(filename);
    if (snapshot) {
      console.log('Snapshot data:', snapshot);
      toast({
        title: "Snapshot Data",
        description: `Active: ${snapshot.activeUsers.length}, Expired: ${snapshot.expiredUsers.length}`,
      });
    }
  };

  const handleCleanup = () => {
    cleanupOldSnapshots(90);
    setSnapshots(getAllSnapshotMetadata());
    toast({
      title: "Cleanup Complete",
      description: "Old snapshots have been removed",
    });
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Snapshot Manager
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateSnapshot}
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create Snapshot'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCleanup}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Cleanup
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{snapshots.length}</div>
              <div className="text-sm text-gray-600">Total Snapshots</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {snapshots.reduce((sum, s) => sum + s.size, 0) / 1024 / 1024 < 1 
                  ? `${(snapshots.reduce((sum, s) => sum + s.size, 0) / 1024).toFixed(1)} KB`
                  : `${(snapshots.reduce((sum, s) => sum + s.size, 0) / 1024 / 1024).toFixed(1)} MB`}
              </div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {snapshots.length > 0 ? new Date(snapshots[0].timestamp).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Latest Snapshot</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recent Snapshots
            </h3>
            {snapshots.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No snapshots available. Create your first snapshot above.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {snapshots.slice(0, 20).map((snapshot) => (
                  <div key={snapshot.filename} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{snapshot.filename}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(snapshot.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{formatFileSize(snapshot.size)}</Badge>
                      <Badge variant="outline">{snapshot.monthYear}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSnapshot(snapshot.filename)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SnapshotManager;
