
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, TrendingDown, TrendingUp, Users, Calendar } from 'lucide-react';
import { getFirstDaySnapshot, compareSnapshots, getLatestSnapshotForMonth } from '@/services/snapshotService';

interface EnhancedActiveUserAlertsProps {
  currentActiveData: any[];
  currentExpiredData: any[];
}

const EnhancedActiveUserAlerts = ({ currentActiveData, currentExpiredData }: EnhancedActiveUserAlertsProps) => {
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateComparison = async () => {
      setIsLoading(true);
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
        
        // Get first day of current month snapshot
        const firstDaySnapshot = getFirstDaySnapshot();
        
        // Get last month's snapshot
        const lastMonthSnapshot = getLatestSnapshotForMonth(lastMonth);

        const currentSnapshot = {
          activeUsers: currentActiveData,
          expiredUsers: currentExpiredData,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          monthYear: currentMonth
        };

        const comparisons = {
          vsFirstDay: firstDaySnapshot ? compareSnapshots(currentSnapshot, firstDaySnapshot) : null,
          vsLastMonth: lastMonthSnapshot ? compareSnapshots(currentSnapshot, lastMonthSnapshot) : null,
          firstDayDate: firstDaySnapshot?.date,
          lastMonthDate: lastMonthSnapshot?.date
        };

        setComparisonData(comparisons);
      } catch (error) {
        console.error('Error generating comparison:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentActiveData.length > 0) {
      generateComparison();
    }
  }, [currentActiveData, currentExpiredData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Active User Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading comparison data...</div>
        </CardContent>
      </Card>
    );
  }

  const decreasedDealers = comparisonData?.vsFirstDay?.activeUsers.decreased || [];
  const hasAlerts = decreasedDealers.length > 0;

  return (
    <div className="space-y-6">
      {/* Alert Section */}
      <Card className={hasAlerts ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${hasAlerts ? 'text-red-700' : 'text-green-700'}`}>
            <AlertTriangle className="h-5 w-5" />
            Active User Alerts
            {hasAlerts && <Badge variant="destructive">{decreasedDealers.length}</Badge>}
          </CardTitle>
          {comparisonData?.firstDayDate && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Compared to: {comparisonData.firstDayDate} (1st of month)
            </p>
          )}
        </CardHeader>
        <CardContent>
          {!hasAlerts ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                No significant drops in active users detected. All systems normal!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {decreasedDealers.slice(0, 5).map((dealer: any, index: number) => (
                <Alert key={index} variant="destructive">
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{dealer.dealer}</span>
                        <span className="mx-2">•</span>
                        <Badge variant="secondary">{dealer.service}</Badge>
                        <span className="mx-2">•</span>
                        <span className="text-sm">Zone {dealer.zone}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          {dealer.difference} users ↓
                        </div>
                        <div className="text-xs text-gray-500">
                          {dealer.previousCount} → {dealer.activeUsers}
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              {decreasedDealers.length > 5 && (
                <p className="text-center text-red-600 text-sm">
                  +{decreasedDealers.length - 5} more dealers affected
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Comparison Table */}
      {comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
            <p className="text-sm text-gray-600">
              Current vs 1st of Month vs Last Month
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Current Active</TableHead>
                  <TableHead>1st of Month</TableHead>
                  <TableHead>Last Month</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentActiveData.slice(0, 10).map((dealer, index) => {
                  const firstDayComparison = comparisonData.vsFirstDay?.activeUsers.decreased.find(
                    (d: any) => d.dealer === dealer.dealer
                  ) || comparisonData.vsFirstDay?.activeUsers.increased.find(
                    (d: any) => d.dealer === dealer.dealer
                  );
                  
                  const lastMonthComparison = comparisonData.vsLastMonth?.activeUsers.decreased.find(
                    (d: any) => d.dealer === dealer.dealer
                  ) || comparisonData.vsLastMonth?.activeUsers.increased.find(
                    (d: any) => d.dealer === dealer.dealer
                  );

                  const firstDayCount = firstDayComparison?.previousCount || dealer.activeUsers;
                  const lastMonthCount = lastMonthComparison?.previousCount || dealer.activeUsers;
                  const trend = firstDayComparison?.difference || 0;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{dealer.dealer}</TableCell>
                      <TableCell>
                        <Badge variant={dealer.service.toLowerCase().includes('tes') ? 'default' : 'secondary'}>
                          {dealer.service}
                        </Badge>
                      </TableCell>
                      <TableCell>{dealer.zone}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {dealer.activeUsers}
                      </TableCell>
                      <TableCell>{firstDayCount}</TableCell>
                      <TableCell>{lastMonthCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trend > 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">+{trend}</span>
                            </>
                          ) : trend < 0 ? (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">{trend}</span>
                            </>
                          ) : (
                            <span className="text-gray-500">No change</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedActiveUserAlerts;
