import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { AnalyticsCharts } from './AnalyticsCharts';
import { ExcelDataViewer } from './ExcelDataViewer';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  FileSpreadsheet, 
  TrendingUp, 
  Upload,
  LogOut,
  User
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FileData {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  upload_date: string;
  status: string;
  file_path: string;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  const fetchFiles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('excel_files')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      setFiles(data || []);
      setTotalFiles(data?.length || 0);
      setTotalSize(data?.reduce((acc, file) => acc + file.file_size, 0) || 0);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Excel Analytics Platform</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalFiles}</div>
              <p className="text-xs text-muted-foreground">Uploaded files</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{formatFileSize(totalSize)}</div>
              <p className="text-xs text-muted-foreground">Storage used</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-muted/50 to-muted/25">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics Ready</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.filter(f => f.status === 'uploaded').length}</div>
              <p className="text-xs text-muted-foreground">Ready for analysis</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="upload" className="space-y-6" value={selectedFile ? "viewer" : undefined}>
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            {selectedFile && (
              <TabsTrigger value="viewer" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Analyze
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload New File</CardTitle>
                <CardDescription>
                  Upload your Excel or CSV files to start analyzing your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onUploadComplete={fetchFiles} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Files</CardTitle>
                <CardDescription>
                  Manage and view your uploaded files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileList 
                  files={files} 
                  onFileDeleted={fetchFiles} 
                  onFileView={setSelectedFile}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  View insights and charts from your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsCharts files={files} />
              </CardContent>
            </Card>
          </TabsContent>

          {selectedFile && (
            <TabsContent value="viewer" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Data Analysis</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFile(null)}
                >
                  Back to Files
                </Button>
              </div>
              <ExcelDataViewer
                fileId={selectedFile.id}
                fileName={selectedFile.filename}
                originalName={selectedFile.original_name}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}