
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchExpiredUsersData, getExpiredZoneSummaries, getHistoricalData, getAvailableDates, type ExpiredDealerData, type ZoneSummary } from "@/services/googleSheetsService";

const DataComparison = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentData, setCurrentData] = useState<ExpiredDealerData[]>([]);
  const [previousData, setPreviousData] = useState<ExpiredDealerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDates = getAvailableDates();
  const currentDate = new Date();

  // Fetch current data on component mount
  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        const data = await fetchExpiredUsersData();
        setCurrentData(data);
      } catch (err) {
        console.error('Error fetching current data:', err);
        setError('Failed to fetch current data');
      }
    };

    fetchCurrentData();
  }, []);

  // Fetch previous data when date is selected
  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const historicalData = getHistoricalData(dateStr);
      if (historicalData?.expired) {
        setPreviousData(historicalData.expired);
        setError(null);
      } else {
        setPreviousData([]);
        setError('No data available for selected date');
      }
    }
  }, [selectedDate]);

  const comparisonData = useMemo(() => {
    if (!currentData.length || !previousData.length) return { tes: [], mcsol: [] };

    const currentZoneSummaries = getExpiredZoneSummaries(currentData);
    const previousZoneSummaries = getExpiredZoneSummaries(previousData);

    const tesComparison: any[] = [];
    const mcsolComparison: any[] = [];

    // Process TES data
    const tesCurrentZones = currentZoneSummaries.filter(z => z.service.toLowerCase().includes('tes'));
    const tesPreviousZones = previousZoneSummaries.filter(z => z.service.toLowerCase().includes('tes'));

    tesCurrentZones.forEach(currentZone => {
      const previousZone = tesPreviousZones.find(p => p.zone === currentZone.zone);
      const previousValue = previousZone?.totalExpired || 0;
      const currentValue = currentZone.totalExpired;
      const difference = currentValue - previousValue;

      tesComparison.push({
        zone: currentZone.zone,
        previous: previousValue,
        current: currentValue,
        difference,
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same'
      });
    });

    // Process McSOL data
    const mcsolCurrentZones = currentZoneSummaries.filter(z => z.service.toLowerCase().includes('mcsol'));
    const mcsolPreviousZones = previousZoneSummaries.filter(z => z.service.toLowerCase().includes('mcsol'));

    mcsolCurrentZones.forEach(currentZone => {
      const previousZone = mcsolPreviousZones.find(p => p.zone === currentZone.zone);
      const previousValue = previousZone?.totalExpired || 0;
      const currentValue = currentZone.totalExpired;
      const difference = currentValue - previousValue;

      mcsolComparison.push({
        zone: currentZone.zone,
        previous: previousValue,
        current: currentValue,
        difference,
        trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same'
      });
    });

    return { tes: tesComparison, mcsol: mcsolComparison };
  }, [currentData, previousData]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return "text-red-600";
      case 'down':
        return "text-green-600";
      default:
        return "text-gray-400";
    }
  };

  const prepareChartData = (data: any[]) => {
    return data.map(item => ({
      zone: item.zone,
      Previous: item.previous,
      Current: item.current
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Data – Current vs Previous</h1>
        <p className="text-gray-600">Compare current date data with any selected previous date</p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Previous Date for Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Current Date (Auto):</label>
              <div className="text-lg font-semibold text-blue-600">
                {format(currentDate, "PPP")}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Previous Date:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select previous date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      return !availableDates.includes(dateStr) || date >= currentDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="text-sm text-gray-600">
              Available dates: {availableDates.length} stored snapshots
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="text-center py-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {!selectedDate && (
        <Card>
          <CardContent className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Previous Date</h3>
            <p className="text-gray-600">
              Choose a previous date from the calendar above to start comparing data.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedDate && !error && (
        <>
          {/* Comparison Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TES Expired Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">TES Expired Users Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparisonData.tes.map((zone, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-900">{zone.zone}</h4>
                        {getTrendIcon(zone.trend)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Previous:</span>
                          <div className="font-bold text-gray-700">{zone.previous.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Current:</span>
                          <div className="font-bold text-gray-900">{zone.current.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Difference:</span>
                          <div className={`font-bold ${getTrendColor(zone.trend)}`}>
                            {zone.difference > 0 ? '+' : ''}{zone.difference.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* McSOL Expired Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">McSOL Expired Users Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparisonData.mcsol.map((zone, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-900">{zone.zone}</h4>
                        {getTrendIcon(zone.trend)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Previous:</span>
                          <div className="font-bold text-gray-700">{zone.previous.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Current:</span>
                          <div className="font-bold text-gray-900">{zone.current.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Difference:</span>
                          <div className={`font-bold ${getTrendColor(zone.trend)}`}>
                            {zone.difference > 0 ? '+' : ''}{zone.difference.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TES Chart */}
            <Card>
              <CardHeader>
                <CardTitle>TES Expired Users Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareChartData(comparisonData.tes)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Previous" fill="#94a3b8" name="Previous Date" />
                      <Bar dataKey="Current" fill="#3b82f6" name="Current Date" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* McSOL Chart */}
            <Card>
              <CardHeader>
                <CardTitle>McSOL Expired Users Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareChartData(comparisonData.mcsol)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Previous" fill="#94a3b8" name="Previous Date" />
                      <Bar dataKey="Current" fill="#8b5cf6" name="Current Date" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DataComparison;
