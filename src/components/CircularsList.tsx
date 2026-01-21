import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Circular } from '../types';
import { useAuth } from '../hooks/useAuth';
import PDFPreviewModal from './PDFPreviewModal';
import toast from 'react-hot-toast';

interface CircularsListProps {
  limit?: number;
  showCarousel?: boolean;
  itemsPerPage?: number;
}

export default function CircularsList({ 
  limit = 10, 
  showCarousel = true,
  itemsPerPage = 3 
}: CircularsListProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedCircularForPreview, setSelectedCircularForPreview] = useState<Circular | null>(null);

  useEffect(() => {
    fetchLatestCirculars();
  }, []);

  const fetchLatestCirculars = async () => {
    try {
      setLoading(true);
      const response = await api.getCirculars({ limit });
      if (response.success && response.circulars) {
        setCirculars(response.circulars);
      }
    } catch (error) {
      console.error('Error fetching circulars:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleNextSlide = () => {
    setCarouselIndex((prev) => (prev + itemsPerPage) % Math.max(circulars.length, 1));
  };

  const handlePrevSlide = () => {
    setCarouselIndex((prev) => {
      const newIndex = prev - itemsPerPage;
      return newIndex < 0 ? Math.max(0, circulars.length - itemsPerPage) : newIndex;
    });
  };

  const handleViewPDF = (circular: Circular) => {
    if (!circular.id) {
      toast.error('PDF is not available for viewing');
      return;
    }
    setSelectedCircularForPreview(circular);
    setPreviewModalOpen(true);
  };

  const handlePreviewDownload = async () => {
    if (!selectedCircularForPreview) return;
    try {
      await api.downloadCircular(
        selectedCircularForPreview.id,
        selectedCircularForPreview.fileName || 'circular.pdf'
      );
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      toast.error(errorMsg);
    }
  };

  const visibleCirculars = circulars
    .slice(carouselIndex, carouselIndex + itemsPerPage)
    .concat(
      carouselIndex + itemsPerPage > circulars.length
        ? circulars.slice(0, (carouselIndex + itemsPerPage) % circulars.length)
        : []
    )
    .slice(0, itemsPerPage);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (circulars.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(circulars.length / itemsPerPage);
  const currentPage = Math.floor(carouselIndex / itemsPerPage);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {visibleCirculars.map((circular, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {circular.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(circular.orderDate)}
                </div>
              </div>
              <CardTitle className="text-base line-clamp-2">{circular.title}</CardTitle>
              <CardDescription className="line-clamp-3 text-xs">
                {circular.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              {user ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewPDF(circular)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => api.downloadCircular(circular.id, circular.fileName)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Login to Access
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Carousel Navigation */}
      {showCarousel && circulars.length > itemsPerPage && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevSlide}
            className="h-10 w-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i * itemsPerPage)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentPage ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextSlide}
            className="h-10 w-10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* PDF Preview Modal */}
      {selectedCircularForPreview && (
        <PDFPreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedCircularForPreview(null);
          }}
          pdfUrl={`/api/circulars/${selectedCircularForPreview.id}/download`}
          fileName={selectedCircularForPreview.fileName || 'circular.pdf'}
          onDownload={handlePreviewDownload}
        />
      )}
    </div>
  );
}
