
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingDown, Users, Calendar } from 'lucide-react';
import { getFirstDaySnapshot, compareSnapshots } from '@/services/snapshotService';

interface ActiveUserAlertsProps {
  currentActiveData: any[];
  currentExpiredData: any[];
}

const ActiveUserAlerts = ({ currentActiveData, currentExpiredData }: ActiveUserAlertsProps) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comparisonDate, setComparisonDate] = useState<string>('');

  useEffect(() => {
    const checkForAlerts = async () => {
      setIsLoading(true);
      try {
        const firstDaySnapshot = getFirstDaySnapshot();
        
        if (!firstDaySnapshot) {
          setAlerts([]);
          setIsLoading(false);
          return;
        }

        setComparisonDate(firstDaySnapshot.date);

        const currentSnapshot = {
          activeUsers: currentActiveData,
          expiredUsers: currentExpiredData,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          monthYear: new Date().toISOString().slice(0, 7)
        };

        const comparison = compareSnapshots(currentSnapshot, firstDaySnapshot);
        
        // Focus on decreased active users as alerts
        const decreasedUsers = comparison.activeUsers.decreased.map(dealer => ({
          ...dealer,
          alertType: 'decreased_active',
          severity: Math.abs(dealer.difference) >= 10 ? 'high' : 'medium'
        }));

        setAlerts(decreasedUsers);
      } catch (error) {
        console.error('Error checking for alerts:', error);
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentActiveData.length > 0) {
      checkForAlerts();
    }
  }, [currentActiveData, currentExpiredData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Active User Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
            Active User Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              {comparisonDate 
                ? `No significant drops in active users compared to ${comparisonDate}. All systems normal!`
                : 'No baseline data available for comparison. Create a snapshot to enable alerts.'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Active User Alerts
          <Badge variant="destructive">{alerts.length}</Badge>
        </CardTitle>
        {comparisonDate && (
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Compared to: {comparisonDate}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <Alert key={index} variant="destructive">
              <TrendingDown className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{alert.dealer}</span>
                    <span className="mx-2">•</span>
                    <Badge variant="secondary">{alert.service}</Badge>
                    <span className="mx-2">•</span>
                    <span className="text-sm">{alert.zone}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {alert.difference} users
                    </div>
                    <div className="text-xs text-gray-500">
                      {alert.previousCount} → {alert.activeUsers}
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveUserAlerts;
