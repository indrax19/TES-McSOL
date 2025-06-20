
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, FileText, FolderOpen } from 'lucide-react';
import { getAllSnapshotMetadata, getSnapshotByFilename } from '@/services/snapshotService';

const SnapshotHistoryManager = () => {
  const [snapshots, setSnapshots] = useState(getAllSnapshotMetadata());
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);

  const handleViewSnapshot = (filename: string) => {
    const snapshot = getSnapshotByFilename(filename);
    setSelectedSnapshot(snapshot);
  };

  const handleDownloadSnapshot = (filename: string) => {
    const snapshot = getSnapshotByFilename(filename);
    if (snapshot) {
      const dataStr = JSON.stringify(snapshot, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Snapshot History (/snapshot_history/)
          </CardTitle>
          <p className="text-sm text-gray-600">
            All historical snapshots stored as timestamped JSON files
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{snapshots.length}</div>
              <div className="text-sm text-gray-600">Total Snapshots</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(snapshots.reduce((sum, s) => sum + s.size, 0) / 1024 / 1024).toFixed(2)} MB
              </div>
              <div className="text-sm text-gray-600">Total Storage</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {snapshots.length > 0 ? snapshots[0].date : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Latest Snapshot</div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((snapshot) => (
                <TableRow key={snapshot.filename}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      {snapshot.filename}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{snapshot.monthYear}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{formatFileSize(snapshot.size)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSnapshot(snapshot.filename)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadSnapshot(snapshot.filename)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {snapshots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No snapshots found. Create your first snapshot to start building history.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSnapshot && (
        <Card>
          <CardHeader>
            <CardTitle>Snapshot Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-semibold">Active Users</h4>
                <p className="text-2xl font-bold text-green-600">
                  {selectedSnapshot.activeUsers.length} records
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Expired Users</h4>
                <p className="text-2xl font-bold text-red-600">
                  {selectedSnapshot.expiredUsers.length} records
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Sample Data</h4>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(selectedSnapshot.activeUsers.slice(0, 3), null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SnapshotHistoryManager;
