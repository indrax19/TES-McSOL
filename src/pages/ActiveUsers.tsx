
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search } from "lucide-react";
import { fetchSheetData } from "@/services/googleSheetsService";
import { useState, useMemo } from "react";

const ActiveUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [sortBy, setSortBy] = useState("activeUsers");

  const { data: dealerData = [], isLoading } = useQuery({
    queryKey: ['sheetData'],
    queryFn: fetchSheetData,
    refetchInterval: 30000,
  });

  const filteredAndSortedData = useMemo(() => {
    let filtered = dealerData.filter(dealer => {
      const matchesSearch = dealer.dealer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService = serviceFilter === "all" || dealer.service.toLowerCase().includes(serviceFilter.toLowerCase());
      const matchesZone = zoneFilter === "all" || dealer.zone === zoneFilter;
      return matchesSearch && matchesService && matchesZone;
    });

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "activeUsers":
          return b.activeUsers - a.activeUsers;
        case "dealer":
          return a.dealer.localeCompare(b.dealer);
        case "zone":
          return a.zone.localeCompare(b.zone);
        default:
          return 0;
      }
    });

    return filtered;
  }, [dealerData, searchTerm, serviceFilter, zoneFilter, sortBy]);

  const totalActiveUsers = filteredAndSortedData.reduce((sum, dealer) => sum + dealer.activeUsers, 0);
  const uniqueZones = Array.from(new Set(dealerData.map(d => d.zone))).filter(Boolean);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2">Loading active users data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Users Dashboard</h1>
        <p className="text-gray-600">Monitor dealers with active user bases</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalActiveUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Dealers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{filteredAndSortedData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Dealer</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {filteredAndSortedData.length > 0 ? Math.round(totalActiveUsers / filteredAndSortedData.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search dealers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="tes">TES</SelectItem>
                <SelectItem value="mcsol">McSOL</SelectItem>
              </SelectContent>
            </Select>

            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {uniqueZones.map(zone => (
                  <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activeUsers">Active Users (High to Low)</SelectItem>
                <SelectItem value="dealer">Dealer Name (A-Z)</SelectItem>
                <SelectItem value="zone">Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Users by Dealer</CardTitle>
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
                  <th className="text-right p-3 font-semibold">Performance</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((dealer, index) => (
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
                    <td className="p-3 text-right">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((dealer.activeUsers / Math.max(...filteredAndSortedData.map(d => d.activeUsers))) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No dealers found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActiveUsers;
