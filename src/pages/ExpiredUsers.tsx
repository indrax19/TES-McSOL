
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserX, Search, AlertTriangle } from "lucide-react";
import { fetchSheetData, getHighExpiredDealers } from "@/services/googleSheetsService";
import { useState, useMemo } from "react";
import ExpiredUsersChart from "@/components/ExpiredUsersChart";

const ExpiredUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [sortBy, setSortBy] = useState("expiredUsers");

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
        case "expiredUsers":
          return b.expiredUsers - a.expiredUsers;
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

  const totalExpiredUsers = filteredAndSortedData.reduce((sum, dealer) => sum + dealer.expiredUsers, 0);
  const highExpiredDealers = getHighExpiredDealers(filteredAndSortedData);
  const uniqueZones = Array.from(new Set(dealerData.map(d => d.zone))).filter(Boolean);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2">Loading expired users data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Expired Users Dashboard</h1>
        <p className="text-gray-600">Monitor dealers with expired user accounts</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expired Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalExpiredUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Dealers (30+)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highExpiredDealers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dealers with Expired</CardTitle>
            <UserX className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredAndSortedData.filter(d => d.expiredUsers > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Dealer</CardTitle>
            <UserX className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {filteredAndSortedData.length > 0 ? Math.round(totalExpiredUsers / filteredAndSortedData.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart for High Expired Dealers */}
      {highExpiredDealers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dealers with 30+ Expired Users</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpiredUsersChart data={highExpiredDealers} />
          </CardContent>
        </Card>
      )}

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
                <SelectItem value="expiredUsers">Expired Users (High to Low)</SelectItem>
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
          <CardTitle>Expired Users by Dealer</CardTitle>
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
                  <th className="text-right p-3 font-semibold">Performance</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((dealer, index) => {
                  const riskLevel = dealer.expiredUsers >= 30 ? "High" : dealer.expiredUsers >= 15 ? "Medium" : "Low";
                  const riskColor = dealer.expiredUsers >= 30 ? "text-red-600" : dealer.expiredUsers >= 15 ? "text-orange-600" : "text-green-600";
                  
                  return (
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
                        <span className={`font-medium ${riskColor}`}>{riskLevel}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((dealer.expiredUsers / Math.max(...filteredAndSortedData.map(d => d.expiredUsers))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

export default ExpiredUsers;
