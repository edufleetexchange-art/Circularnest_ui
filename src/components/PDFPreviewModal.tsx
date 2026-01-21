import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { X, Download, Loader, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
  onDownload: () => void;
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  fileName,
  onDownload
}: PDFPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPDFBlob();
    } else {
      // Clean up blob URL when modal closes
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    }
    
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pdfUrl]);

  const loadPDFBlob = async () => {
    setLoading(true);
    setError(null);
    
    // Clean up previous blob URL
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    try {
      // Construct the API URL properly - use relative path for same-origin requests
      // This ensures Vite proxy works in dev and Vercel rewrites work in production
      let downloadUrl = pdfUrl;
      
      // If pdfUrl doesn't start with http, ensure it starts with /api or use VITE_API_URL
      if (!pdfUrl.startsWith('http')) {
        const apiBaseUrl = import.meta.env.VITE_API_URL;
        if (apiBaseUrl) {
          // Remove /api prefix if present since VITE_API_URL typically includes it
          const path = pdfUrl.startsWith('/api') ? pdfUrl : `/api${pdfUrl}`;
          // If VITE_API_URL ends with /api, don't duplicate it
          downloadUrl = apiBaseUrl.endsWith('/api') 
            ? `${apiBaseUrl}${pdfUrl.replace(/^\/api/, '')}`
            : `${apiBaseUrl}${path}`;
        } else {
          // Use relative path - works with Vite proxy in dev and same-origin in production
          downloadUrl = pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`;
        }
      }

      console.log('PDFPreviewModal: Loading PDF from:', downloadUrl);

      // Fetch PDF as blob
      const token = localStorage.getItem('auth_token');
      const response = await fetch(downloadUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });

      console.log('PDFPreviewModal: Response status:', response.status, response.statusText);
      console.log('PDFPreviewModal: Response Content-Type:', response.headers.get('Content-Type'));

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('PDFPreviewModal: Error response:', errorText);
        throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('PDFPreviewModal: Blob received - type:', blob.type, 'size:', blob.size);
      
      // Verify blob has content - be lenient with MIME type as server always sends PDF
      if (blob.size === 0) {
        throw new Error('Empty PDF blob received');
      }
      
      // Create blob URL for iframe - force PDF MIME type for proper rendering
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      console.log('PDFPreviewModal: Created blob URL:', url);
      
      setBlobUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('PDFPreviewModal: Load error:', err);
      setLoading(false);
      setError('Unable to preview PDF in browser. Please download to view.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 bg-background [&>button]:hidden">

        {/* Hidden description for accessibility */}
        <DialogDescription className="sr-only">
          PDF preview modal for {fileName}. Use the view controls below to navigate the document.
        </DialogDescription>

        {/* Header */}
        <DialogHeader className="px-6 pt-4 pb-3 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base truncate">{fileName}</DialogTitle>
          </div>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload}
              className="gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-10 w-10 p-0"
            >
              <X className="w-10 h-10" />
            </Button>
          </div>
        </DialogHeader>

        {/* PDF Viewer Container */}
        <div className="flex-1 relative bg-slate-100 overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Loading PDF...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="text-center max-w-sm mx-auto px-4">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <p className="text-sm text-muted-foreground mb-6">
                  The PDF preview is not available in your browser. You can still download it using the button above.
                </p>
                <Button onClick={onDownload} className="gap-2 w-full">
                  <Download className="w-4 h-4" />
                  Download PDF Instead
                </Button>
              </div>
            </div>
          )}

          {/* PDF Viewer - using object tag with iframe fallback for better compatibility */}
          {blobUrl && !error && (
            <object
              data={blobUrl}
              type="application/pdf"
              className="w-full h-full"
              title={`PDF Preview: ${fileName}`}
            >
              {/* Fallback to iframe if object doesn't work */}
              <iframe
                src={blobUrl}
                className="w-full h-full border-0"
                title={`PDF Preview: ${fileName}`}
                allow="fullscreen"
              />
            </object>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
