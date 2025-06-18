
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getHistoricalData, getAvailableDates } from "@/services/googleSheetsService";
import { format } from "date-fns";

const HistoricalData = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMode, setViewMode] = useState("summary");
  
  const availableDates = getAvailableDates();
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const historicalData = formattedDate ? getHistoricalData(formattedDate) : null;

  const summaryStats = useMemo(() => {
    if (!historicalData) return null;

    const totalActive = historicalData.reduce((sum, dealer) => sum + dealer.activeUsers, 0);
    const totalExpired = historicalData.reduce((sum, dealer) => sum + dealer.expiredUsers, 0);
    const tesData = historicalData.filter(d => d.service.toLowerCase().includes('tes'));
    const mcsolData = historicalData.filter(d => d.service.toLowerCase().includes('mcsol'));

    return {
      totalActive,
      totalExpired,
      totalDealers: historicalData.length,
      tesActive: tesData.reduce((sum, d) => sum + d.activeUsers, 0),
      tesExpired: tesData.reduce((sum, d) => sum + d.expiredUsers, 0),
      mcsolActive: mcsolData.reduce((sum, d) => sum + d.activeUsers, 0),
      mcsolExpired: mcsolData.reduce((sum, d) => sum + d.expiredUsers, 0),
      highExpiredDealers: historicalData.filter(d => d.expiredUsers >= 30).length
    };
  }, [historicalData]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-400";
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historical Data Analysis</h1>
        <p className="text-gray-600">View and compare historical performance data</p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Historical Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-64 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return !availableDates.includes(dateStr);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary View</SelectItem>
                <SelectItem value="detailed">Detailed Table</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600">
              Available dates: {availableDates.length} stored snapshots
            </div>
          </div>
        </CardContent>
      </Card>

      {availableDates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Historical Data Available</h3>
            <p className="text-gray-600">
              Historical data will be automatically stored as you use the dashboard. 
              Check back later to view historical comparisons.
            </p>
          </CardContent>
        </Card>
      )}

      {!selectedDate && availableDates.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Date</h3>
            <p className="text-gray-600">
              Choose a date from the calendar above to view historical data.
              Available dates are highlighted.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedDate && !historicalData && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No data available for {format(selectedDate, "PPP")}</p>
          </CardContent>
        </Card>
      )}

      {selectedDate && historicalData && summaryStats && viewMode === "summary" && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Active Users</CardTitle>
                {getChangeIcon(0)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summaryStats.totalActive.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Historical snapshot for {format(selectedDate, "MMM dd, yyyy")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expired Users</CardTitle>
                {getChangeIcon(0)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {summaryStats.totalExpired.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  High risk dealers: {summaryStats.highExpiredDealers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
                {getChangeIcon(0)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {summaryStats.totalDealers}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Active dealers in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
                {getChangeIcon(0)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((summaryStats.totalActive / (summaryStats.totalActive + summaryStats.totalExpired)) * 100)}%
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  User retention rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Service Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>TES Service Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-lg font-bold text-green-600">
                      {summaryStats.tesActive.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Expired Users</span>
                    <span className="text-lg font-bold text-red-600">
                      {summaryStats.tesExpired.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(summaryStats.tesActive / (summaryStats.tesActive + summaryStats.tesExpired)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>McSOL Service Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-lg font-bold text-green-600">
                      {summaryStats.mcsolActive.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Expired Users</span>
                    <span className="text-lg font-bold text-red-600">
                      {summaryStats.mcsolExpired.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(summaryStats.mcsolActive / (summaryStats.mcsolActive + summaryStats.mcsolExpired)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {selectedDate && historicalData && viewMode === "detailed" && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Historical Data - {format(selectedDate, "PPP")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Dealer</th>
                    <th className="text-left p-3 font-semibold">Service</th>
                    <th className="text-left p-3 font-semibold">Zone</th>
                    <th className="text-right p-3 font-semibold">Active Users</th>
                    <th className="text-right p-3 font-semibold">Expired Users</th>
                    <th className="text-right p-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalData.map((dealer, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{dealer.dealer}</td>
                      <td className="p-3">
                        <Badge variant={dealer.service.toLowerCase().includes('tes') ? 'default' : 'secondary'}>
                          {dealer.service}
                        </Badge>
                      </td>
                      <td className="p-3">{dealer.zone}</td>
                      <td className="p-3 text-right font-bold text-green-600">
                        {dealer.activeUsers.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold text-red-600">
                        {dealer.expiredUsers.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-bold">
                        {(dealer.activeUsers + dealer.expiredUsers).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HistoricalData;
