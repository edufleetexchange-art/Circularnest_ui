import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { LogOut, FileText, Calendar, CheckCircle, XCircle, Eye, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFPreviewModal from '../components/PDFPreviewModal';
import Navbar from '../components/Navbar';

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
  uploadedByEmail?: string;
}

export default function AdminReview() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<PendingUpload | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedUploadForPreview, setSelectedUploadForPreview] = useState<PendingUpload | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadPendingUploads();
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
      await loadPendingUploads(true);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const manualRefresh = async () => {
    await refreshData();
    toast.success('Data refreshed successfully');
  };

  const loadPendingUploads = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      // Filter to only show pending uploads (status='pending')
      const response = await api.getPendingUploads('pending');
      
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
        reviewedAt: u.updatedAt,
        uploadedByEmail: u.uploadedBy?.email || (u.guestName ? `${u.guestName} (Guest)${u.guestEmail ? ` - ${u.guestEmail}` : ''}` : 'Guest User')
      }));
      
      setUploads(mappedUploads);
    } catch (error) {
      if (!silent) {
        console.error('Failed to load pending uploads:', error);
        toast.error('Failed to load pending uploads');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleApprove = async () => {
    if (!selectedUpload) return;

    setReviewing(true);
    try {
      await api.approvePendingUpload(selectedUpload.id, reviewNotes);
      
      toast.success('Circular approved and published');
      setShowReviewDialog(false);
      setReviewNotes('');
      setSelectedUpload(null);
      setReviewAction(null);
      // Remove approved item from list immediately (it's been moved to circulars)
      setUploads(uploads.filter(u => u.id !== selectedUpload.id));
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve circular');
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUpload) return;

    setReviewing(true);
    try {
      await api.rejectPendingUpload(selectedUpload.id, reviewNotes);

      toast.success('Circular rejected');
      setShowReviewDialog(false);
      setReviewNotes('');
      setSelectedUpload(null);
      setReviewAction(null);
      // Remove rejected item from list immediately (it's been moved to circulars with rejected status)
      setUploads(uploads.filter(u => u.id !== selectedUpload.id));
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject circular');
    } finally {
      setReviewing(false);
    }
  };

  const openReviewDialog = (upload: PendingUpload, action: 'approve' | 'reject') => {
    setSelectedUpload(upload);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const handlePreview = async (upload: PendingUpload) => {
    try {
      if (!upload.id) {
        toast.error('PDF is not available for viewing');
        return;
      }
      setSelectedUploadForPreview(upload);
      setPreviewModalOpen(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to preview PDF');
    }
  };

  const handlePreviewDownload = async () => {
    if (!selectedUploadForPreview) return;
    try {
      const downloadUrl = `/api/pending/${selectedUploadForPreview.id}/file`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = selectedUploadForPreview.fileName || 'circular.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const formatFileSize = (bytes: number | string | null | undefined) => {
    if (bytes === null || bytes === undefined || bytes === '') return '0 B';
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(numBytes) || numBytes === 0) return '0 B';
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
        title="Review Submissions"
        subtitle={user?.email}
        rightActions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Pending Approval</h2>
            <p className="text-muted-foreground">Review and approve/reject submitted circulars</p>
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

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Circulars ({uploads.length})</CardTitle>
            <CardDescription>Review user submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading submissions...</div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending approvals to review.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploads.map((upload) => (
                      <TableRow key={upload.id}>
                        <TableCell className="font-medium max-w-xs truncate">{upload.title}</TableCell>
                        <TableCell><Badge variant="outline">{upload.category}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formatDate(upload.orderDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {upload.uploadedByEmail}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {upload.fileName} ({formatFileSize(upload.fileSize)})
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(upload.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(upload)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openReviewDialog(upload, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openReviewDialog(upload, 'reject')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
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
        </Card>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve' ? 'Approve Circular' : 'Reject Circular'}
              </DialogTitle>
              <DialogDescription>
                {selectedUpload?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm"><strong>Category:</strong> {selectedUpload?.category}</p>
                <p className="text-sm"><strong>Submitted by:</strong> {selectedUpload?.uploadedByEmail}</p>
                <p className="text-sm"><strong>Order Date:</strong> {formatDate(selectedUpload?.orderDate)}</p>
                <p className="text-sm"><strong>File:</strong> {selectedUpload?.fileName} ({formatFileSize(selectedUpload?.fileSize)})</p>
                <p className="text-sm"><strong>Description:</strong> {selectedUpload?.description}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {reviewAction === 'approve' ? 'Approval Notes (optional)' : 'Rejection Reason (optional)'}
                </label>
                <Textarea
                  placeholder={reviewAction === 'approve' ? 'Add any notes...' : 'Explain why this circular is being rejected...'}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                  disabled={reviewing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                  onClick={reviewAction === 'approve' ? handleApprove : handleReject}
                  disabled={reviewing}
                >
                  {reviewing ? 'Processing...' : (reviewAction === 'approve' ? 'Approve' : 'Reject')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Preview Modal */}
        {selectedUploadForPreview && (
          <PDFPreviewModal
            isOpen={previewModalOpen}
            onClose={() => {
              setPreviewModalOpen(false);
              setSelectedUploadForPreview(null);
            }}
            pdfUrl={`/api/pending/${selectedUploadForPreview.id}/file`}
            fileName={selectedUploadForPreview.fileName || 'circular.pdf'}
            onDownload={handlePreviewDownload}
          />
        )}
      </main>
    </div>
  );
}
