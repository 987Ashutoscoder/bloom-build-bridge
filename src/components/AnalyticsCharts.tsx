import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { FileSpreadsheet, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

interface FileData {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  upload_date: string;
  status: string;
}

interface AnalyticsChartsProps {
  files: FileData[];
}

export function AnalyticsCharts({ files }: AnalyticsChartsProps) {
  // Prepare data for charts
  const formatFileSize = (bytes: number) => {
    return Math.round(bytes / (1024 * 1024) * 100) / 100; // Convert to MB
  };

  // Files by size chart data
  const fileSizeData = files.map(file => ({
    name: file.original_name.substring(0, 15) + (file.original_name.length > 15 ? '...' : ''),
    size: formatFileSize(file.file_size),
    fullName: file.original_name
  }));

  // Upload timeline data
  const uploadTimelineData = files.reduce((acc: any[], file) => {
    const date = new Date(file.upload_date).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.uploads += 1;
      existing.totalSize += formatFileSize(file.file_size);
    } else {
      acc.push({
        date,
        uploads: 1,
        totalSize: formatFileSize(file.file_size)
      });
    }
    
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Status distribution data
  const statusData = files.reduce((acc: any[], file) => {
    const existing = acc.find(item => item.status === file.status);
    
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({
        status: file.status,
        count: 1
      });
    }
    
    return acc;
  }, []);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No analytics data available</h3>
        <p className="text-muted-foreground">
          Upload some files to see analytics and insights about your data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(files.reduce((acc, file) => acc + formatFileSize(file.file_size), 0) * 100) / 100} MB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Size</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.length > 0 
                ? Math.round((files.reduce((acc, file) => acc + formatFileSize(file.file_size), 0) / files.length) * 100) / 100
                : 0} MB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter(file => 
                new Date(file.upload_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Sizes Chart */}
        <Card>
          <CardHeader>
            <CardTitle>File Sizes</CardTitle>
            <CardDescription>Size distribution of your uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fileSizeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(label, payload) => {
                    const item = fileSizeData.find(d => d.name === label);
                    return item ? item.fullName : label;
                  }}
                  formatter={(value) => [`${value} MB`, 'Size']}
                />
                <Bar dataKey="size" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>File Status</CardTitle>
            <CardDescription>Distribution of file processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upload Timeline */}
        {uploadTimelineData.length > 1 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upload Timeline</CardTitle>
              <CardDescription>File uploads and total size over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={uploadTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis yAxisId="left" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} />
                  <Tooltip />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="uploads"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalSize"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}