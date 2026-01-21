import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { CATEGORIES } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { LogOut, Plus, Upload, FileText, Calendar, Trash2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface PendingUpload {
  id: string;
  title: string;
  orderDate: string;
  description: string;
  pdfUrl: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function UserUpload() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Education');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadUserUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadUserUploads = async () => {
    try {
      if (!user?.id) return;
      
      const response = await api.getMySubmissions();
      
      const mappedUploads = response.pendingUploads.map((u: any) => ({
        id: u._id,
        title: u.title,
        orderDate: u.orderDate,
        description: u.description,
        pdfUrl: u.fileId,
        fileName: u.fileName,
        fileSize: u.fileSize,
        uploadedBy: u.uploadedBy,
        category: u.category || 'Education',
        status: u.status || 'pending',
        adminNotes: u.reviewNotes,
        createdAt: u.createdAt,
        reviewedAt: u.updatedAt
      }));
      
      setUploads(mappedUploads);
    } catch (error) {
      console.error('Failed to load uploads:', error);
      // Don't show toast on initial load if table doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + Math.random() * 30;
          return next > 90 ? 90 : next;
        });
      }, 200);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || 'Untitled');
      formData.append('orderDate', orderDate || '');
      formData.append('description', description || '');
      formData.append('category', category || 'Education');

      // Use unified submitPendingUpload() for both logged-in and guest users
      await api.submitPendingUpload(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      
      if (user) {
        toast.success('File submitted for review. Admin will review and approve soon.');
      } else {
        toast.success('File submitted for review as guest. Admin will review and approve soon. Log in to track your submissions!');
      }
      
      // Close dialog and reset after a brief delay
      setTimeout(() => {
        setDialogOpen(false);
        resetForm();
        if (user) {
          loadUserUploads();
        }
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to submit file for review');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, status: string) => {
    // Prevent deletion of approved circulars
    if (status === 'approved') {
      toast.error('Cannot delete approved circulars. This circular has been approved and published. Only administrators can manage published circulars.');
      return;
    }

    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    try {
      await api.deletePendingUpload(id);
      toast.success('Submission deleted successfully');
      loadUserUploads();
    } catch (error: any) {
      console.error('Delete error:', error);
      const message = error.response?.data?.message || 'Failed to delete submission';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setOrderDate('');
    setDescription('');
    setCategory('Education');
    setFile(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    // Reset file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Submit Circulars</h1>
              <p className="text-sm text-muted-foreground">{user?.email || 'Guest User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            {user && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
            {!user && (
              <>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!user && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              You can submit circulars as a guest! However, to track your submissions and see their approval status, please <button onClick={() => navigate('/login')} className="font-semibold hover:underline">log in</button> or <button onClick={() => navigate('/signup')} className="font-semibold hover:underline">sign up</button>.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Submit a New Circular</h2>
            <p className="text-muted-foreground">Submit PDF files for admin review and approval</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Submit New Circular
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit New Circular</DialogTitle>
                <DialogDescription>Fill in the details and upload the PDF file for review</DialogDescription>
              </DialogHeader>
              {uploadSuccess && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">Upload Successful!</p>
                    <p className="text-sm text-green-700">Your circular has been submitted for review.</p>
                  </div>
                </div>
              )}
              {uploading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Uploading...</p>
                    <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
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
                    {uploading ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your submissions will be reviewed by an administrator. Once approved, they will be published and visible to all institution users.
          </AlertDescription>
        </Alert>

        {/* Submissions List - Only for logged-in users */}
        {user && (
        <Card>
          <CardHeader>
            <CardTitle>Your Submissions ({uploads.length})</CardTitle>
            <CardDescription>Track the status of your circular submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading submissions...</div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No submissions yet. Click "Submit New Circular" to upload your first one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploads.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell className="font-medium">{upload.title}</TableCell>
                        <TableCell><Badge variant="outline">{upload.category}</Badge></TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(upload.status)}>
                            {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(upload.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {upload.fileName} ({formatFileSize(upload.fileSize)})
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {upload.status === 'rejected' && upload.adminNotes && (
                              <Button
                                size="sm"
                                variant="outline"
                                title={`Rejection reason: ${upload.adminNotes}`}
                              >
                                View Notes
                              </Button>
                            )}
                            {upload.status === 'approved' && (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                Published - Managed by Admin
                              </Badge>
                            )}
                            {upload.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(upload.id, upload.status)}
                                title="Delete this submission"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  );
}