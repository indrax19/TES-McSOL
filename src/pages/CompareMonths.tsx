
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserX, 
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { 
  getAvailableMonths, 
  getLatestSnapshotForMonth, 
  compareSnapshots 
} from '@/services/snapshotService';

const CompareMonths = () => {
  const [selectedMonth1, setSelectedMonth1] = useState<string>('');
  const [selectedMonth2, setSelectedMonth2] = useState<string>('');
  const [comparison, setComparison] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  const availableMonths = getAvailableMonths();

  const handleCompare = async () => {
    if (!selectedMonth1 || !selectedMonth2) return;
    
    setIsComparing(true);
    try {
      const snapshot1 = getLatestSnapshotForMonth(selectedMonth1);
      const snapshot2 = getLatestSnapshotForMonth(selectedMonth2);
      
      if (!snapshot1 || !snapshot2) {
        console.error('Snapshots not found for selected months');
        return;
      }
      
      const comparisonResult = compareSnapshots(snapshot1, snapshot2);
      setComparison({
        ...comparisonResult,
        month1: selectedMonth1,
        month2: selectedMonth2,
        snapshot1Date: snapshot1.date,
        snapshot2Date: snapshot2.date
      });
    } catch (error) {
      console.error('Error comparing snapshots:', error);
    } finally {
      setIsComparing(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!comparison) return null;
    
    const filterArray = (arr: any[]) => {
      return arr.filter(item => {
        const matchesSearch = item.dealer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesService = serviceFilter === 'all' || item.service.toLowerCase().includes(serviceFilter.toLowerCase());
        const matchesZone = zoneFilter === 'all' || item.zone === zoneFilter;
        return matchesSearch && matchesService && matchesZone;
      });
    };

    return {
      activeUsers: {
        increased: filterArray(comparison.activeUsers.increased),
        decreased: filterArray(comparison.activeUsers.decreased),
        new: filterArray(comparison.activeUsers.new),
        removed: filterArray(comparison.activeUsers.removed)
      },
      expiredUsers: {
        increased: filterArray(comparison.expiredUsers.increased),
        decreased: filterArray(comparison.expiredUsers.decreased),
        new: filterArray(comparison.expiredUsers.new),
        removed: filterArray(comparison.expiredUsers.removed)
      }
    };
  }, [comparison, searchTerm, serviceFilter, zoneFilter]);

  const getUniqueZones = () => {
    if (!comparison) return [];
    const allItems = [
      ...comparison.activeUsers.increased,
      ...comparison.activeUsers.decreased,
      ...comparison.activeUsers.new
    ];
    return [...new Set(allItems.map((item: any) => item.zone))];
  };

  const renderComparisonTable = (data: any[], title: string, type: 'active' | 'expired') => {
    if (data.length === 0) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Dealer</th>
                  <th className="text-left p-3">Service</th>
                  <th className="text-left p-3">Zone</th>
                  <th className="text-right p-3">{comparison.month2}</th>
                  <th className="text-right p-3">{comparison.month1}</th>
                  <th className="text-right p-3">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3">{item.dealer}</td>
                    <td className="p-3">
                      <Badge variant={item.service.toLowerCase().includes('tes') ? 'default' : 'secondary'}>
                        {item.service}
                      </Badge>
                    </td>
                    <td className="p-3">{item.zone}</td>
                    <td className="p-3 text-right font-medium">
                      {type === 'active' ? item.activeUsers : item.expiredUsers}
                    </td>
                    <td className="p-3 text-right">
                      {item.previousCount || 0}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.difference > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={item.difference > 0 ? 'text-green-600' : 'text-red-600'}>
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Month-wise Comparison</h1>
        <p className="text-gray-600">Compare data between different months to analyze trends</p>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Months to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedMonth1} onValueChange={setSelectedMonth1}>
              <SelectTrigger>
                <SelectValue placeholder="Select first month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth2} onValueChange={setSelectedMonth2}>
              <SelectTrigger>
                <SelectValue placeholder="Select second month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleCompare}
              disabled={!selectedMonth1 || !selectedMonth2 || isComparing}
              className="flex items-center gap-2"
            >
              <GitCompare className="h-4 w-4" />
              {isComparing ? 'Comparing...' : 'Compare'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {getUniqueZones().map(zone => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparison && filteredData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Comparison Summary
              </CardTitle>
              <p className="text-sm text-gray-600">
                Comparing {comparison.month1} ({comparison.snapshot1Date}) vs {comparison.month2} ({comparison.snapshot2Date})
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredData.activeUsers.increased.length}
                  </div>
                  <div className="text-sm text-gray-600">Active Users ↑</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredData.activeUsers.decreased.length}
                  </div>
                  <div className="text-sm text-gray-600">Active Users ↓</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredData.expiredUsers.increased.length}
                  </div>
                  <div className="text-sm text-gray-600">Expired Users ↑</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredData.expiredUsers.decreased.length}
                  </div>
                  <div className="text-sm text-gray-600">Expired Users ↓</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Expired Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {renderComparisonTable(filteredData.activeUsers.increased, 'Active Users Increased', 'active')}
              {renderComparisonTable(filteredData.activeUsers.decreased, 'Active Users Decreased', 'active')}
              {renderComparisonTable(filteredData.activeUsers.new, 'New Dealers (Active Users)', 'active')}
              {renderComparisonTable(filteredData.activeUsers.removed, 'Removed Dealers (Active Users)', 'active')}
            </TabsContent>

            <TabsContent value="expired" className="space-y-4">
              {renderComparisonTable(filteredData.expiredUsers.increased, 'Expired Users Increased', 'expired')}
              {renderComparisonTable(filteredData.expiredUsers.decreased, 'Expired Users Decreased', 'expired')}
              {renderComparisonTable(filteredData.expiredUsers.new, 'New Dealers (Expired Users)', 'expired')}
              {renderComparisonTable(filteredData.expiredUsers.removed, 'Removed Dealers (Expired Users)', 'expired')}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {availableMonths.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Snapshots Available</h3>
            <p className="text-gray-500">Create some snapshots first to enable month-wise comparison.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompareMonths;
