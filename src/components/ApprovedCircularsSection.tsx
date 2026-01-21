import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, Eye, Calendar, X, Loader, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { api } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog';

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

export default function ApprovedCircularsSection() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    circular: Circular | null;
  }>({ isOpen: false, circular: null });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchApprovedCirculars = async () => {
      try {
        setLoading(true);
        console.log('[ApprovedCircularsSection] Fetching approved circulars from API...');
        
        const response = await api.getCircularsWithStorage({ 
          status: 'approved',
          limit: 6 
        });
        
        console.log('[ApprovedCircularsSection] Fetch response:', {
          success: response.success,
          totalCirculars: response.circulars?.length || 0,
          message: response.message
        });
        
        if (response.success) {
          setCirculars(response.circulars);
          setError(null);
        } else {
          setError(response.message || 'Failed to load circulars');
        }
      } catch (err: any) {
        console.error('[ApprovedCircularsSection] Error fetching circulars:', {
          errorMessage: err.message,
          errorStack: err.stack,
          timestamp: new Date().toISOString()
        });
        setError(err.message || 'Failed to load circulars');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedCirculars();
  }, []);

  // Safety: if the embedded PDF never fires onLoad (browser/plugin quirks),
  // stop showing the loading overlay after a few seconds so users can still
  // use "Open in New Tab" / "Download".
  useEffect(() => {
    if (!previewModal.isOpen) return;

    const timer = setTimeout(() => {
      setPdfLoading(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, [previewModal.isOpen, previewModal.circular?.fileUrl]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleDownload = async (circular: Circular) => {
    try {
      // Validate file URL
      if (!circular.fileUrl || circular.fileUrl.trim() === '') {
        throw new Error('PDF file is not available for download');
      }

      setDownloadingId(circular.id);
      console.log('[ApprovedCircularsSection] Starting download:', {
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
      
      console.log('[ApprovedCircularsSection] Download triggered successfully');
      
      toast({
        title: 'Success',
        description: `${circular.title} download started successfully`,
        duration: 3000
      });
    } catch (error: any) {
      console.error('[ApprovedCircularsSection] Download error:', {
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Fallback: Open in new tab if blob download fails
      if (circular.fileUrl) {
        window.open(circular.fileUrl, '_blank');
        toast({
          title: 'Opening PDF',
          description: 'PDF opened in new tab. Use browser\'s save option to download.',
          duration: 4000
        });
      } else {
        toast({
          title: 'Download Failed',
          description: error?.message || 'Failed to download circular. Please try again.',
          variant: 'destructive',
          duration: 4000
        });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = (circular: Circular) => {
    // Guard against missing fileUrl to avoid an infinite loading overlay.
    if (!circular.fileUrl || circular.fileUrl.trim() === '') {
      toast({
        title: 'Preview Unavailable',
        description: 'PDF file URL is missing. Please refresh and try again.',
        variant: 'destructive',
        duration: 4000
      });
      return;
    }

    console.log('[ApprovedCircularsSection] Opening PDF preview modal:', {
      id: circular.id,
      title: circular.title,
      fileName: circular.fileName,
      fileUrl: circular.fileUrl,
      timestamp: new Date().toISOString()
    });
    setPdfLoading(true);
    setPdfError(false);
    setPreviewModal({
      isOpen: true,
      circular
    });
  };

  const handleOpenInNewTab = () => {
    if (previewModal.circular?.fileUrl) {
      console.log('[ApprovedCircularsSection] Opening PDF in new tab:', {
        fileUrl: previewModal.circular.fileUrl,
        fileName: previewModal.circular.fileName
      });
      window.open(previewModal.circular.fileUrl, '_blank');
    }
  };

  const closePreviewModal = () => {
    console.log('[ApprovedCircularsSection] Closing PDF preview modal');
    setPreviewModal({ isOpen: false, circular: null });
    setPdfLoading(true);
    setPdfError(false);
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16 mb-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Latest Approved Circulars</h3>
          <p className="text-muted-foreground">Loading recent circulars...</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-8">
                <div className="h-4 bg-muted rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error && circulars.length === 0) {
    console.log('[ApprovedCircularsSection] Error state:', error);
    return (
      <section className="container mx-auto px-4 py-16 mb-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Latest Approved Circulars</h3>
          <p className="text-muted-foreground">No approved circulars available at this time.</p>
        </div>
      </section>
    );
  }

  if (!circulars || circulars.length === 0) {
    console.log('[ApprovedCircularsSection] No circulars to display');
    return (
      <section className="container mx-auto px-4 py-16 mb-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Latest Approved Circulars</h3>
          <p className="text-muted-foreground">No approved circulars available yet. Check back soon!</p>
        </div>
      </section>
    );
  }

  console.log('[ApprovedCircularsSection] Rendering approved circulars:', {
    totalCount: circulars.length,
    circulars: circulars.map(c => ({ id: c.id, title: c.title, status: c.status }))
  });

  return (
    <>
      <section className="container mx-auto px-4 py-16 mb-16 relative z-10">
        <div className="text-center mb-12 relative z-10">
          <h3 className="text-3xl font-bold mb-4">Latest Approved Circulars</h3>
          <p className="text-muted-foreground">Browse recently approved notices from education departments</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8 relative z-10">
          {circulars.map((circular) => (
            <Card key={circular.id} className="border-2 hover:shadow-lg transition-shadow relative z-10">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2 text-lg">
                      {circular.title}
                    </CardTitle>
                  </div>
                  <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {circular.orderDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDate(circular.orderDate)}
                      </span>
                    </div>
                  )}
                  {circular.category && (
                    <div className="inline-block">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {circular.category}
                      </span>
                    </div>
                  )}
                </div>

                {circular.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {circular.description}
                  </p>
                )}

                <div className="flex gap-2 pt-4 border-t relative z-20">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 relative z-30 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleView(circular);
                    }}
                    type="button"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 relative z-30 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownload(circular);
                    }}
                    disabled={downloadingId === circular.id}
                    type="button"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {downloadingId === circular.id ? 'Downloading...' : 'Download'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center relative z-10">
          <Button
            size="lg"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/circulars');
            }}
            type="button"
            className="cursor-pointer"
          >
            View All Circulars
          </Button>
        </div>
      </section>

      {/* PDF Preview Modal */}
      <Dialog
        open={previewModal.isOpen}
        onOpenChange={(open) => {
          // Radix calls onOpenChange for both open/close in controlled mode.
          // Only close when it requests closing.
          if (!open) closePreviewModal();
        }}
      >
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 bg-background">
          <DialogDescription className="sr-only">
            PDF preview modal for {previewModal.circular?.fileName}. Use the view controls below to navigate the document.
          </DialogDescription>

          {/* Header - Must stay above loading overlay */}
          <DialogHeader className="relative z-40 px-6 pt-4 pb-3 border-b flex flex-row items-center justify-between space-y-0">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base truncate">
                {previewModal.circular?.title || previewModal.circular?.fileName}
              </DialogTitle>
            </div>
            <div className="flex gap-2 ml-4 flex-shrink-0 pointer-events-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenInNewTab}
                className="gap-2 whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => previewModal.circular && handleDownload(previewModal.circular)}
                className="gap-2 whitespace-nowrap"
                disabled={downloadingId === previewModal.circular?.id}
              >
                <Download className="w-4 h-4" />
                {downloadingId === previewModal.circular?.id ? 'Downloading...' : 'Download'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={closePreviewModal}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* PDF Viewer Container */}
          <div className="flex-1 relative bg-slate-100 overflow-hidden">
            {/* Loading State - Shows overlay with spinner, but allows pointer events to pass through to interactive elements */}
            {pdfLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-30 pointer-events-none">
                <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 px-6 py-8 rounded-lg shadow-lg">
                  <Loader className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-medium">Loading PDF...</p>
                  <p className="text-xs text-muted-foreground">This may take a moment</p>
                </div>
              </div>
            )}

            {/* Error State - Shows when PDF fails to load */}
            {pdfError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-30">
                <div className="text-center max-w-sm mx-auto px-4">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">Unable to preview PDF</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    The PDF preview is not available in your browser. This can happen due to file type, browser compatibility, or CORS restrictions. You can open it in a new tab or download it instead.
                  </p>
                  <div className="flex gap-2 justify-center flex-col sm:flex-row">
                    <Button
                      onClick={handleOpenInNewTab}
                      variant="outline"
                      className="gap-2 w-full sm:w-auto"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </Button>
                    <Button
                      onClick={() => previewModal.circular && handleDownload(previewModal.circular)}
                      className="gap-2 w-full sm:w-auto"
                      disabled={downloadingId === previewModal.circular?.id}
                    >
                      <Download className="w-4 h-4" />
                      {downloadingId === previewModal.circular?.id ? 'Downloading...' : 'Download PDF'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Preview - iframe is the most reliable cross-browser PDF embed */}
            {previewModal.circular?.fileUrl && !pdfError && (
              <iframe
                key={`pdf-${previewModal.circular.id}`}
                src={`${previewModal.circular.fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={`PDF Preview: ${previewModal.circular.fileName}`}
                onLoad={() => {
                  console.log('[ApprovedCircularsSection] PDF iframe loaded', {
                    timestamp: new Date().toISOString(),
                    fileUrl: previewModal.circular?.fileUrl,
                    fileName: previewModal.circular?.fileName
                  });
                  setTimeout(() => setPdfLoading(false), 250);
                }}
                onError={() => {
                  console.log('[ApprovedCircularsSection] PDF iframe failed to load');
                  setPdfLoading(false);
                  setPdfError(true);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
