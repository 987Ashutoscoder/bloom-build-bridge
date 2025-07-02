import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Download, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChartGeneratorProps {
  fileId: string;
  fileName: string;
  columns: string[];
  data: any[];
}

const chartTypes = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChartIcon },
  { value: 'pie', label: 'Pie Chart', icon: PieChartIcon },
];

export function ChartGenerator({ fileId, fileName, columns, data }: ChartGeneratorProps) {
  const [selectedChart, setSelectedChart] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (xAxis && yAxis && data.length > 0) {
      generateChartData();
    }
  }, [xAxis, yAxis, data]);

  const generateChartData = () => {
    try {
      const processedData = data.map(row => ({
        [xAxis]: row[xAxis],
        [yAxis]: parseFloat(row[yAxis]) || 0,
        name: row[xAxis],
        value: parseFloat(row[yAxis]) || 0
      })).filter(item => item[xAxis] && !isNaN(item[yAxis]));

      setChartData(processedData.slice(0, 20)); // Limit to 20 items for performance
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process chart data',
        variant: 'destructive',
      });
    }
  };

  const downloadChart = () => {
    // Convert chart to downloadable format (for demo purposes, we'll download as JSON)
    const chartConfig = {
      fileName,
      chartType: selectedChart,
      xAxis,
      yAxis,
      data: chartData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(chartConfig, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_chart_${selectedChart}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Chart configuration downloaded successfully',
    });
  };

  const renderChart = () => {
    if (!chartData.length || !xAxis || !yAxis) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Select X and Y axes to generate chart
        </div>
      );
    }

    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--accent))', 
      'hsl(var(--secondary))',
      'hsl(var(--muted))'
    ];

    switch (selectedChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={yAxis} 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default: // bar
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey={yAxis} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Chart Generator</CardTitle>
        <CardDescription>
          Select axes and chart type to generate interactive visualizations from {fileName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <Select value={selectedChart} onValueChange={setSelectedChart}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>X-Axis</Label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select X-axis column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Y-Axis</Label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select Y-axis column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart Display */}
        <div className="border rounded-lg p-4 bg-card">
          {renderChart()}
        </div>

        {/* Download Button */}
        {chartData.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={downloadChart} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Chart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}