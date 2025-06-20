import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Loader2 } from "lucide-react";
import { getHistoricalData, getAvailableDates } from "@/services/googleSheetsService";
import { format, parse } from "date-fns";

interface DealerData {
  dealer: string;
  service: string;
  zone: string;
  activeUsers: number;
  expiredUsers: number;
}

interface HistoricalData {
  active: DealerData[];
  expired: DealerData[];
}

const HistoricalData = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const currentDate = new Date();
  const formattedCurrentDate = format(currentDate, 'yyyy-MM-dd');
  const formattedSelectedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Fetch available dates
  const { data: availableDates = [], isLoading: isDatesLoading, error: datesError } = useQuery({
    queryKey: ['availableDates'],
    queryFn: getAvailableDates,
  });

  // Fetch historical data for selected date
  const { data, isLoading, error } = useQuery({
    queryKey: ['historicalData', formattedSelectedDate],
    queryFn: () => getHistoricalData(formattedSelectedDate),
    enabled: !!formattedSelectedDate,
  });

  // Set default date to the most recent available date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate && !isDatesLoading) {
      const latestDateStr = availableDates.sort().reverse()[0];
      setSelectedDate(parse(latestDateStr, 'yyyy-MM-dd', new Date()));
    }
  }, [availableDates, isDatesLoading, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historical Data</h1>
        <p className="text-gray-600">View snapshots of data from previous dates</p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
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
                {isDatesLoading ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      return !availableDates.includes(dateStr) || date > new Date();
                    }}
                    initialFocus
                  />
                )}
              </PopoverContent>
            </Popover>

            <div className="text-sm text-gray-600">
              {isDatesLoading ? 'Loading dates...' : `Available dates: ${availableDates.length} stored snapshots`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-600">Error loading data: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading historical data...</p>
          </CardContent>
        </Card>
      )}

      {/* No Available Dates */}
      {!isDatesLoading && availableDates.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Historical Data Available</h3>
            <p className="text-gray-600">
              Historical data will be automatically stored as you use the dashboard.
              Check back later to view historical data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Selected Date */}
      {!isDatesLoading && !selectedDate && availableDates.length > 0 && !error && (
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

      {/* No Data for Selected Date */}
      {selectedDate && !data && !isLoading && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">
              No data available for {format(selectedDate, "PPP")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Historical Data Display */}
      {selectedDate && data && !isLoading && !error && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Data from {format(selectedDate, "PPP")}
            </h2>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.active.reduce((sum, dealer) => sum + dealer.activeUsers, 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Across {data.active.length} dealers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Expired Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.expired.reduce((sum, dealer) => sum + dealer.expiredUsers, 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Across {data.expired.length} dealers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">High Risk Dealers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {data.expired.filter(dealer => dealer.expiredUsers >= 20).length}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  20+ expired users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tables */}
          <Tabs defaultValue="expired" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expired">Expired Users</TabsTrigger>
              <TabsTrigger value="active">Active Users</TabsTrigger>
            </TabsList>

            <TabsContent value="expired">
              <Card>
                <CardHeader>
                  <CardTitle>Expired Users Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Dealer</th>
                          <th className="text-left p-3 font-semibold">Service</th>
                          <th className="text-left p-3 font-semibold">Zone</th>
                          <th className="text-right p-3 font-semibold">Expired Users</th>
                          <th className="text-left p-3 font-semibold">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expired
                          .sort((a, b) => b.expiredUsers - a.expiredUsers)
                          .map((dealer, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">{dealer.dealer}</td>
                              <td className="p-3">
                                <Badge variant={dealer.service.toLowerCase().includes('tes') ? 'default' : 'secondary'}>
                                  {dealer.service}
                                </Badge>
                              </td>
                              <td className="p-3">{dealer.zone}</td>
                              <td className="p-3 text-right font-bold text-red-600">
                                {dealer.expiredUsers.toLocaleString()}
                              </td>
                              <td className="p-3">
                                <Badge variant={dealer.expiredUsers >= 20 ? 'destructive' : 'outline'}>
                                  {dealer.expiredUsers >= 20 ? 'High Risk' : 'Normal'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Active Users Details</CardTitle>
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
                        </tr>
                      </thead>
                      <tbody>
                        {data.active
                          .sort((a, b) => b.activeUsers - a.activeUsers)
                          .map((dealer, index) => (
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
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default HistoricalData;
