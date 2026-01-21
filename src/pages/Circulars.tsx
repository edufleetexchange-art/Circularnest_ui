import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CATEGORIES } from '../types';

interface Circular {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  orderDate?: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  status: 'pending' | 'approved' | 'rejected';
  isPublished?: number;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LogOut, Download, FileText, Calendar, Search, Building, Upload, User as UserIcon, Home, CheckSquare, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFPreviewModal from '../components/PDFPreviewModal';
import Navbar from '../components/Navbar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trash2 } from 'lucide-react';

export default function Circulars() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Shared state
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [filteredCirculars, setFilteredCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedCircularForPreview, setSelectedCircularForPreview] = useState<Circular | null>(null);
  
  // Admin-only state
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'pending' | 'approved' | 'rejected' | null>('pending');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  const [title, setTitle] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Education');
  const [file, setFile] = useState<File | null>(null);

  // Load circulars on mount
  useEffect(() => {
    loadCirculars();
    if (user?.role === 'admin') {
      loadPendingCount();
    }
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
    }
  }, [user?.role, searchParams]);

  // Auto-refresh for admins
  useEffect(() => {
    if (user?.role === 'admin' && autoRefresh) {
      const refreshInterval = setInterval(() => {
        refreshData();
      }, 10000);
      return () => clearInterval(refreshInterval);
    }
  }, [autoRefresh, user?.role]);

  // Filter circulars when search/category changes
  useEffect(() => {
    filterCirculars();
  }, [searchQuery, circulars, selectedCategory]);

  const filterCirculars = () => {
    let filtered = circulars;

    // For non-admins, show only approved circulars
    if (user?.role !== 'admin') {
      filtered = filtered.filter(c => c.status === 'approved' || !c.status);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    setFilteredCirculars(filtered);
  };

  const loadCirculars = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'admin') {
        // Admin sees all circulars by status
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          api.getCircularsWithStorage({ status: 'pending', limit: 100 }),
          api.getCircularsWithStorage({ status: 'approved', limit: 100 }),
          api.getCircularsWithStorage({ status: 'rejected', limit: 100 })
        ]);

        let allCirculars: Circular[] = [];

        // Map pending
        if (pendingRes.success && pendingRes.circulars) {
          allCirculars = [...pendingRes.circulars];
        }

        // Map approved
        if (approvedRes.success && approvedRes.circulars) {
          const existingIds = new Set(allCirculars.map(c => c.id));
          const approved = approvedRes.circulars.filter(c => !existingIds.has(c.id));
          allCirculars = [...allCirculars, ...approved];
        }

        // Map rejected
        if (rejectedRes.success && rejectedRes.circulars) {
          const existingIds = new Set(allCirculars.map(c => c.id));
          const rejected = rejectedRes.circulars.filter(c => !existingIds.has(c.id));
          allCirculars = [...allCirculars, ...rejected];
        }

        setCirculars(allCirculars);
      } else {
        // Guests and regular users see only approved circulars
        const response = await api.getCircularsWithStorage({ status: 'approved' });
        if (response.success) {
          setCirculars(response.circulars);
        }
      }
    } catch (error) {
      toast.error('Failed to load circulars');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadCirculars(), loadPendingCount()]);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const response = await api.getCircularsWithStorage({ status: 'pending' });
      if (response.success) {
        setPendingCount(response.circulars.length);
      }
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  const handleDownload = async (circular: Circular) => {
    try {
      if (!circular.fileUrl || circular.fileUrl.trim() === '') {
        toast.error('PDF is not available for download');
        return;
      }
      
      console.log('[Circulars] Starting download:', {
        id: circular.id,
        title: circular.title,
        fileName: circular.fileName,
        fileUrl: circular.fileUrl
      });
      
      // Fetch the file as blob to force download (works with cross-origin)
      const response = await fetch(circular.fileUrl, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create download link with blob URL
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', circular.fileName || 'circular.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      toast.success('PDF download started successfully');
    } catch (error) {
      console.error('[Circulars] Download error:', error);
      
      // Fallback: Open in new tab if blob download fails
      if (circular.fileUrl) {
        window.open(circular.fileUrl, '_blank');
        toast.success('PDF opened in new tab. Use browser\'s save option to download.');
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
        toast.error(errorMsg);
      }
    }
  };

  const handleViewPDF = (circular: Circular) => {
    if (!circular.fileUrl) {
      toast.error('PDF is not available for viewing');
      return;
    }
    setSelectedCircularForPreview(circular);
    setPreviewModalOpen(true);
  };

  const handlePreviewDownload = async () => {
    if (!selectedCircularForPreview) return;
    await handleDownload(selectedCircularForPreview);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      // Upload file directly through API
      const response = await api.uploadCircularWithFile({
        title: title || 'Untitled',
        description: description || '',
        category: category || 'Education',
        orderDate: orderDate || new Date().toISOString().split('T')[0],
        file: file,
        status: user?.role === 'admin' ? 'approved' : 'pending'
      });

      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }

      toast.success('Circular uploaded successfully');
      setDialogOpen(false);
      resetForm();
      loadCirculars();
    } catch (error: any) {
      const message = error.message || 'Failed to upload circular';
      toast.error(message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this circular?')) return;
    
    try {
      const response = await api.deleteCircularById(id);
      if (response.success) {
        toast.success('Circular deleted successfully');
        loadCirculars();
      } else {
        toast.error(response.message || 'Failed to delete circular');
      }
    } catch (error: any) {
      const message = error.message || 'Failed to delete circular';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setOrderDate('');
    setDescription('');
    setCategory('Education');
    setFile(null);
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getCategoryCount = (category: string): number => {
    return circulars.filter((c) => c.category === category && (user?.role === 'admin' || c.status === 'approved' || !c.status)).length;
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

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const pendingCirculars = circulars.filter(c => c.status === 'pending');
  const approvedCirculars = circulars.filter(c => c.status === 'approved' || !c.status);
  const rejectedCirculars = circulars.filter(c => c.status === 'rejected');

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navbar */}
      <Navbar
        title={isAdmin ? 'Admin Dashboard' : 'Notice Nest'}
        subtitle={user?.institutionName || user?.email || 'Guest'}
        rightActions={
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/review')} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <CheckSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Review {pendingCount > 0 && `(${pendingCount})`}</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
                {user && (
                  <Button onClick={() => navigate('/upload')} className="gap-2 bg-purple-600 hover:bg-purple-700">
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Upload Circular</span>
                  </Button>
                )}
              </>
            )}
            {user && (
              <Button variant="outline" onClick={() => navigate('/profile')} className="gap-2">
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">My Profile</span>
              </Button>
            )}
            {user && (
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pt-20">
        {/* Admin-specific controls */}
        {isAdmin && (
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
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
                onClick={refreshData}
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
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
                    <Label htmlFor="file">PDF File * (Only PDF files allowed)</Label>
                    <Input
                      id="file"
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
        )}

        {/* Admin Statistics */}
        {isAdmin && (
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
        )}

        {/* Admin Tables View */}
        {isAdmin && loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
            <p className="mt-4">Loading circulars...</p>
          </div>
        ) : isAdmin ? (
          <div className="space-y-6">
            {/* Pending Section */}
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
                    <div className="text-center py-8 text-muted-foreground">No pending circulars</div>
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
                              <TableCell className="font-medium">{circular.title}</TableCell>
                              <TableCell><Badge variant="secondary">{circular.category}</Badge></TableCell>
                              <TableCell className="text-sm">{formatDate(circular.orderDate)}</TableCell>
                              <TableCell className="max-w-xs truncate text-sm">{circular.description}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {circular.fileName}<br/>({formatFileSize(circular.fileSize)})
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewPDF(circular)}
                                  >
                                    View
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

            {/* Approved Section */}
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
                    <div className="text-center py-8 text-muted-foreground">No approved circulars yet</div>
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
                              <TableCell className="font-medium">{circular.title}</TableCell>
                              <TableCell><Badge variant="secondary">{circular.category}</Badge></TableCell>
                              <TableCell className="text-sm">{formatDate(circular.orderDate)}</TableCell>
                              <TableCell className="max-w-xs truncate text-sm">{circular.description}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {circular.fileName}<br/>({formatFileSize(circular.fileSize)})
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewPDF(circular)}
                                  >
                                    View
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

            {/* Rejected Section */}
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
                    <div className="text-center py-8 text-muted-foreground">No rejected circulars</div>
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
                                {circular.fileName}<br/>({formatFileSize(circular.fileSize)})
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewPDF(circular)}
                                  >
                                    View
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
        ) : (
          // User/Guest Grid View
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Category Navigation */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                  <CardDescription>Filter by category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    className="w-full justify-between h-auto py-2"
                    onClick={() => setSelectedCategory(null)}
                  >
                    <span>All Categories</span>
                    <Badge variant="secondary">{circulars.filter(c => c.status === 'approved' || !c.status).length}</Badge>
                  </Button>

                  <div className="space-y-1">
                    {CATEGORIES.map((category) => {
                      const count = getCategoryCount(category);
                      return (
                        <Button
                          key={category}
                          variant={selectedCategory === category ? 'default' : 'outline'}
                          className="w-full justify-between h-auto py-2"
                          onClick={() => setSelectedCategory(category)}
                        >
                          <span className="text-left text-sm">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedCategory ? `${selectedCategory} Circulars` : 'All Circulars'}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedCategory
                      ? `Viewing ${selectedCategory} circulars`
                      : 'View and download all available circulars and notices'}
                  </p>
                </div>
                
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search circulars by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Circulars Grid */}
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading circulars...</div>
              ) : filteredCirculars.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {searchQuery ? 'No circulars found' : 'No circulars available'}
                  </p>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : selectedCategory
                      ? 'No circulars for this category yet'
                      : 'Check back later for new circulars'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCirculars.map((circular) => (
                    <Card key={circular.id} className="hover:shadow-lg transition-shadow flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="space-y-2">
                          <CardTitle className="text-sm line-clamp-2">{circular.title}</CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {circular.category}
                            </Badge>
                            <Badge className={`text-xs ${
                              circular.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              circular.status === 'approved' ? 'bg-green-100 text-green-800' :
                              circular.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {circular.status || 'approved'}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="text-xs line-clamp-2">
                          {circular.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-between space-y-2 pb-3">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Order Date:</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {formatDate(circular.orderDate)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">File:</span>
                            <Badge variant="secondary" className="text-xs">
                              {formatFileSize(circular.fileSize)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPDF(circular)}
                            className="flex-1 text-xs"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(circular)}
                            className="flex-1 text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* PDF Preview Modal */}
      {selectedCircularForPreview && (
        <PDFPreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedCircularForPreview(null);
          }}
          pdfUrl={selectedCircularForPreview.fileUrl}
          fileName={selectedCircularForPreview.fileName || 'circular.pdf'}
          onDownload={handlePreviewDownload}
        />
      )}
    </div>
  );
}
