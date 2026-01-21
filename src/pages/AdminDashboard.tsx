import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Circular, CATEGORIES } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { LogOut, Plus, Upload, FileText, Calendar, Trash2, CheckSquare, Home, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [allCirculars, setAllCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [expandedSection, setExpandedSection] = useState<'pending' | 'approved' | 'rejected' | null>('pending');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [title, setTitle] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Education');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadCirculars();
    loadPendingCount();
  }, []);

  // Real-time auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      // Refresh data every 10 seconds
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, 10000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadCirculars(true), loadPendingCount(true)]);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const manualRefresh = async () => {
    await refreshData();
    toast.success('Data refreshed successfully');
  };

  const loadPendingCount = async (silent = false) => {
    try {
      const response = await api.getPendingUploads('pending');
      if (response.success && response.pendingUploads) {
        setPendingCount(response.pendingUploads.length);
      }
    } catch (error) {
      if (!silent) {
        console.error('Failed to load pending count:', error);
      }
    }
  };

  const loadCirculars = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      // Fetch pending circulars
      const pendingResponse = await api.getPendingUploads('pending');
      // Fetch approved circulars (includes legacy ones without status field)
      const approvedResponse = await api.getCirculars({ limit: 100, status: 'approved' });
      // Fetch rejected circulars separately
      const rejectedResponse = await api.getCirculars({ category: 'rejected' });
      
      console.log('Pending Response:', pendingResponse);
      console.log('Approved Response:', approvedResponse);
      console.log('Rejected Response:', rejectedResponse);
      
      let mappedCirculars: Circular[] = [];
      
      // Map pending circulars
      if (pendingResponse.success && pendingResponse.pendingUploads) {
        const pendingMapped = pendingResponse.pendingUploads.map((c: any) => ({
          id: c._id,
          title: c.title,
          orderDate: c.orderDate,
          description: c.description,
          pdfUrl: `/api/circulars/${c._id}/download`,
          fileName: c.fileName,
          fileSize: c.fileSize,
          uploadedBy: c.uploadedBy?._id || c.uploadedBy,
          category: c.category || 'Education',
          createdAt: c.createdAt,
          isApprovedByAdmin: c.isApprovedByAdmin || false,
          status: 'pending'
        }));
        mappedCirculars = pendingMapped;
        console.log('Mapped pending circulars:', pendingMapped.length);
      }
      
      // Map approved circulars and deduplicate by ID
      if (approvedResponse.success && approvedResponse.circulars) {
        const existingIds = new Set(mappedCirculars.map(c => c.id));
        const approvedMapped = approvedResponse.circulars
          .filter((c: any) => !existingIds.has(c._id)) // Remove duplicates
          .map((c: any) => ({
            id: c._id,
            title: c.title,
            orderDate: c.orderDate,
            description: c.description,
            pdfUrl: `/api/circulars/${c._id}/download`,
            fileName: c.fileName,
            fileSize: c.fileSize,
            uploadedBy: c.uploadedBy?._id || c.uploadedBy,
            category: c.category || 'Education',
            createdAt: c.createdAt,
            isApprovedByAdmin: c.isApprovedByAdmin || false,
            status: c.status || 'approved' // Keep original status or default to approved
          }));
        mappedCirculars = [...mappedCirculars, ...approvedMapped];
        console.log('Mapped approved circulars:', approvedMapped.length);
      }
      
      // Map rejected circulars and deduplicate by ID
      if (rejectedResponse.success && rejectedResponse.circulars) {
        const existingIds = new Set(mappedCirculars.map(c => c.id));
        const rejectedMapped = rejectedResponse.circulars
          .filter((c: any) => !existingIds.has(c._id)) // Remove duplicates
          .map((c: any) => ({
            id: c._id,
            title: c.title,
            orderDate: c.orderDate,
            description: c.description,
            pdfUrl: `/api/circulars/${c._id}/download`,
            fileName: c.fileName,
            fileSize: c.fileSize,
            uploadedBy: c.uploadedBy?._id || c.uploadedBy,
            category: c.category || 'Education',
            createdAt: c.createdAt,
            isApprovedByAdmin: c.isApprovedByAdmin || false,
            status: c.status // Keep original status (should be 'rejected')
          }));
        mappedCirculars = [...mappedCirculars, ...rejectedMapped];
        console.log('Mapped rejected circulars:', rejectedMapped.length);
      }
      
      console.log('Total mapped circulars:', mappedCirculars.length);
      console.log('Filtered counts:', {
        pending: mappedCirculars.filter(c => c.status === 'pending').length,
        approved: mappedCirculars.filter(c => c.status === 'approved' || !c.status).length,
        rejected: mappedCirculars.filter(c => c.status === 'rejected').length
      });
      setAllCirculars(mappedCirculars);
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load circulars');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Filter circulars by status
  const pendingCirculars = allCirculars.filter(c => c.status === 'pending');
  const approvedCirculars = allCirculars.filter(c => c.status === 'approved' || !c.status);
  const rejectedCirculars = allCirculars.filter(c => c.status === 'rejected');
  
  console.log('Filtered counts:', {
    total: allCirculars.length,
    pending: pendingCirculars.length,
    approved: approvedCirculars.length,
    rejected: rejectedCirculars.length
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || 'Untitled');
      formData.append('description', description || '');
      formData.append('category', category || 'Education');
      if (orderDate) {
        formData.append('orderDate', orderDate);
      }

      const response = await api.uploadCircular(formData);

      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }

      toast.success('Circular uploaded successfully');
      setDialogOpen(false);
      resetForm();
      loadCirculars();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to upload circular';
      toast.error(message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this circular?')) return;
    
    try {
      const response = await api.deleteCircular(id);
      if (response.success) {
        toast.success('Circular deleted successfully');
        loadCirculars();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete circular';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setOrderDate('');
    setDescription('');
    setCategory('Education');
    setFile(null);
    
    // Reset file input
    const fileInput = document.getElementById('adminFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number | string | null | undefined) => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (!numBytes || numBytes === 0) return '0 B';
    if (numBytes < 1024) return numBytes + ' B';
    if (numBytes < 1024 * 1024) return (numBytes / 1024).toFixed(1) + ' KB';
    return (numBytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navbar */}
      <Navbar
        title="Admin Dashboard"
        subtitle={user?.email}
        rightActions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-10 py-20">
        {/* Navigation and Auto-Refresh Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/admin/review')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Review Submissions {pendingCount > 0 && `(${pendingCount})`}
            </Button>
          </div>
          
          {/* Real-time refresh controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
              <span>
                {autoRefresh ? 'Live' : 'Paused'} • 
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={manualRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
            </Button>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Circulars Management</h2>
            <p className="text-muted-foreground">Upload and manage your circulars and notices</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Circular
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Circular</DialogTitle>
                <DialogDescription>Add details and upload the PDF file</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Circular Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., New Academic Guidelines 2024"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderDate">Order Date *</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the circular..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminFile">PDF File * (Only PDF files allowed)</Label>
                  <Input
                    id="adminFile"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0] || null;
                      if (selectedFile) {
                        const isPDF = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
                        if (!isPDF) {
                          toast.error('Invalid file type. Only PDF files are allowed.');
                          e.target.value = '';
                          setFile(null);
                          return;
                        }
                        const fileSizeMB = selectedFile.size / (1024 * 1024);
                        if (fileSizeMB > 10) {
                          toast.error('File size must be less than 10MB');
                          e.target.value = '';
                          setFile(null);
                          return;
                        }
                      }
                      setFile(selectedFile);
                    }}
                    required
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <FileText className="w-4 h-4" />
                      <span>✓ Selected: {file.name} ({formatFileSize(file.size)})</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCirculars.length}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCirculars.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{rejectedCirculars.length}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4">Loading circulars...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Circulars Section */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedSection(expandedSection === 'pending' ? null : 'pending')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <span className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></span>
                      Pending Approval
                      <Badge className="bg-yellow-100 text-yellow-800 ml-2">{pendingCirculars.length}</Badge>
                    </CardTitle>
                    <CardDescription>Circulars awaiting review and approval</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedSection === 'pending' ? '▼' : '▶'}
                  </Button>
                </div>
              </CardHeader>
              {expandedSection === 'pending' && (
                <CardContent>
                  {pendingCirculars.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending circulars
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingCirculars.map((circular) => (
                            <TableRow key={circular.id} className="bg-yellow-50/30">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {circular.title}
                                  {circular.isApprovedByAdmin && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      User Submitted
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="secondary">{circular.category}</Badge></TableCell>
                              <TableCell className="text-sm">{formatDate(circular.orderDate)}</TableCell>
                              <TableCell className="max-w-xs truncate text-sm">{circular.description}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {circular.fileName}<br/>
                                ({formatFileSize(circular.fileSize)})
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(circular.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Approved Circulars Section */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedSection(expandedSection === 'approved' ? null : 'approved')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                      Approved Circulars
                      <Badge className="bg-green-100 text-green-800 ml-2">{approvedCirculars.length}</Badge>
                    </CardTitle>
                    <CardDescription>Published and accessible to all users</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedSection === 'approved' ? '▼' : '▶'}
                  </Button>
                </div>
              </CardHeader>
              {expandedSection === 'approved' && (
                <CardContent>
                  {approvedCirculars.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No approved circulars yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedCirculars.map((circular) => (
                            <TableRow key={circular.id} className="bg-green-50/30">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {circular.title}
                                  {!circular.status && (
                                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                                      Legacy
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="secondary">{circular.category}</Badge></TableCell>
                              <TableCell className="text-sm">{formatDate(circular.orderDate)}</TableCell>
                              <TableCell className="max-w-xs truncate text-sm">{circular.description}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {circular.fileName}<br/>
                                ({formatFileSize(circular.fileSize)})
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => api.downloadCircular(circular.id, circular.fileName)}
                                  >
                                    View&Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(circular.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Rejected Circulars Section */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedSection(expandedSection === 'rejected' ? null : 'rejected')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <span className="h-3 w-3 bg-red-500 rounded-full"></span>
                      Rejected Circulars
                      <Badge className="bg-red-100 text-red-800 ml-2">{rejectedCirculars.length}</Badge>
                    </CardTitle>
                    <CardDescription>Circulars that did not meet approval criteria</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedSection === 'rejected' ? '▼' : '▶'}
                  </Button>
                </div>
              </CardHeader>
              {expandedSection === 'rejected' && (
                <CardContent>
                  {rejectedCirculars.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No rejected circulars
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rejectedCirculars.map((circular) => (
                            <TableRow key={circular.id} className="bg-red-50/30">
                              <TableCell className="font-medium">{circular.title}</TableCell>
                              <TableCell><Badge variant="secondary">{circular.category}</Badge></TableCell>
                              <TableCell className="text-sm">{formatDate(circular.orderDate)}</TableCell>
                              <TableCell className="max-w-xs truncate text-sm">{circular.description}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {circular.fileName}<br/>
                                ({formatFileSize(circular.fileSize)})
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => api.downloadCircular(circular.id, circular.fileName)}
                                  >
                                    View&Download
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(circular.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
