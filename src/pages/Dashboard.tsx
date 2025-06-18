import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserX, TrendingUp, Database } from "lucide-react";
import { fetchActiveUsersData, fetchExpiredUsersData, getZoneSummaries, storeHistoricalData } from "@/services/googleSheetsService";
import { useEffect } from "react";

const Dashboard = () => {
  const { data: activeData = [], isLoading: activeLoading, error: activeError, refetch: refetchActive } = useQuery({
    queryKey: ['activeData'],
    queryFn: fetchActiveUsersData,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const { data: expiredData = [], isLoading: expiredLoading, error: expiredError, refetch: refetchExpired } = useQuery({
    queryKey: ['expiredData'],
    queryFn: fetchExpiredUsersData,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Combine data for zone summaries
  const combinedData = [...activeData.map(d => ({ ...d, expiredUsers: 0 })), ...expiredData.map(d => ({ ...d, activeUsers: 0 }))];
  const zoneSummaries = getZoneSummaries(combinedData);
  
  // Store data whenever it's fetched
  useEffect(() => {
    if (activeData.length > 0 || expiredData.length > 0) {
      storeHistoricalData(activeData, expiredData);
    }
  }, [activeData, expiredData]);

  const totalActive = activeData.reduce((sum, dealer) => sum + dealer.activeUsers, 0);
  const totalExpired = expiredData.reduce((sum, dealer) => sum + dealer.expiredUsers, 0);
  const totalDealers = new Set([...activeData.map(d => d.dealer), ...expiredData.map(d => d.dealer)]).size;
  const highExpiredCount = expiredData.filter(d => d.expiredUsers >= 30).length;

  const isLoading = activeLoading || expiredLoading;
  const error = activeError || expiredError;

  const refetch = () => {
    refetchActive();
    refetchExpired();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading real-time data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
        <p className="text-gray-600 mb-4">Failed to fetch data from Google Sheets</p>
        <button 
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TES & McSOL Analytics Dashboard</h1>
        <p className="text-xl text-gray-600">Real-time dealer performance monitoring</p>
        <div className="mt-4 text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalActive.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expired Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalExpired.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalDealers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Expired (30+)</CardTitle>
            <Database className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highExpiredCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Summaries */}
      <Card>
        <CardHeader>
          <CardTitle>Zone-wise Summary</CardTitle>
          <CardDescription>Performance overview by zones and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zoneSummaries.map((summary, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{summary.zone}</h3>
                  <Badge variant="outline">{summary.service}</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">Active:</span>
                    <span className="font-medium">{summary.totalActive.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Expired:</span>
                    <span className="font-medium">{summary.totalExpired.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>Overview of current data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {new Set([...activeData, ...expiredData].filter(d => d.service.toLowerCase().includes('tes')).map(d => d.dealer)).size}
              </div>
              <div className="text-sm text-gray-600">TES Dealers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {new Set([...activeData, ...expiredData].filter(d => d.service.toLowerCase().includes('mcsol')).map(d => d.dealer)).size}
              </div>
              <div className="text-sm text-gray-600">McSOL Dealers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((totalActive / (totalActive + totalExpired)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Active Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {Math.round((totalExpired / (totalActive + totalExpired)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Expiry Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
