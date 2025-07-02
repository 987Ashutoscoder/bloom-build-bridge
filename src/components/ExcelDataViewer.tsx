import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartGenerator } from './ChartGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { FileSpreadsheet, Eye, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelDataViewerProps {
  fileId: string;
  fileName: string;
  originalName: string;
}

interface SheetData {
  name: string;
  data: any[];
  columns: string[];
}

export function ExcelDataViewer({ fileId, fileName, originalName }: ExcelDataViewerProps) {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);

  useEffect(() => {
    loadFileData();
  }, [fileId]);

  const loadFileData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Download file from storage
      const { data: fileData, error } = await supabase.storage
        .from('excel-files')
        .download(`${user.id}/${fileName}`);

      if (error) throw error;

      const arrayBuffer = await fileData.arrayBuffer();
      setFileData(arrayBuffer);
      parseExcelFile(arrayBuffer);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load file data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const parseExcelFile = (arrayBuffer: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetsData: SheetData[] = [];

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);
          
          const formattedData = rows.map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          sheetsData.push({
            name: sheetName,
            data: formattedData,
            columns: headers.filter(h => h && h.toString().trim() !== '')
          });
        }
      });

      setSheets(sheetsData);
      saveAnalyticsData(sheetsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse Excel file',
        variant: 'destructive',
      });
    }
  };

  const saveAnalyticsData = async (sheetsData: SheetData[]) => {
    if (!user) return;

    try {
      // Save analytics data for each sheet
      const promises = sheetsData.map(sheet => 
        supabase
          .from('analytics_data')
          .upsert({
            user_id: user.id,
            file_id: fileId,
            sheet_name: sheet.name,
            data: {
              columns: sheet.columns,
              rowCount: sheet.data.length,
              sampleData: sheet.data.slice(0, 5) // Store first 5 rows as sample
            }
          })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to save analytics data:', error);
    }
  };

  const downloadProcessedData = (sheetIndex: number) => {
    const sheet = sheets[sheetIndex];
    if (!sheet) return;

    const ws = XLSX.utils.json_to_sheet(sheet.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    
    XLSX.writeFile(wb, `${originalName}_processed_${sheet.name}.xlsx`);
    
    toast({
      title: 'Success',
      description: `Downloaded processed data for ${sheet.name}`,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading file data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sheets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4" />
            <p>No data available or file could not be parsed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSheet = sheets[activeSheet];

  return (
    <div className="space-y-6">
      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {originalName}
          </CardTitle>
          <CardDescription>
            {sheets.length} sheet{sheets.length !== 1 ? 's' : ''} • 
            {sheets.reduce((acc, sheet) => acc + sheet.data.length, 0)} total rows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sheets.map((sheet, index) => (
              <Badge 
                key={sheet.name}
                variant={index === activeSheet ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setActiveSheet(index)}
              >
                {sheet.name} ({sheet.data.length} rows)
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Analysis Tabs */}
      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Data Preview
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Generate Charts
          </TabsTrigger>
          <TabsTrigger value="download" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview - {currentSheet.name}</CardTitle>
              <CardDescription>
                Showing first 100 rows of {currentSheet.data.length} total rows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {currentSheet.columns.map((column) => (
                        <TableHead key={column} className="font-medium">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSheet.data.slice(0, 100).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {currentSheet.columns.map((column) => (
                          <TableCell key={column} className="text-sm">
                            {row[column]?.toString() || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <ChartGenerator
            fileId={fileId}
            fileName={currentSheet.name}
            columns={currentSheet.columns}
            data={currentSheet.data}
          />
        </TabsContent>

        <TabsContent value="download">
          <Card>
            <CardHeader>
              <CardTitle>Download Options</CardTitle>
              <CardDescription>
                Download processed data and analysis results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sheets.map((sheet, index) => (
                <div key={sheet.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{sheet.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {sheet.data.length} rows • {sheet.columns.length} columns
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => downloadProcessedData(index)}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Sheet
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}