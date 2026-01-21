import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Circular, CATEGORIES } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LogOut, Download, FileText, Calendar, Search, Building, Upload, User as UserIcon, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import PDFPreviewModal from '../components/PDFPreviewModal';
import Navbar from '../components/Navbar';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [filteredCirculars, setFilteredCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedCircularForPreview, setSelectedCircularForPreview] = useState<Circular | null>(null);

  useEffect(() => {
    loadCirculars();
  }, []);

  useEffect(() => {
    filterCirculars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, circulars, selectedCategory]);

  const filterCirculars = () => {
    let filtered = circulars;

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
      const response = await api.getCirculars();
      
      const mappedCirculars = response.circulars.map((c: any) => ({
        id: c._id,
        title: c.title,
        orderDate: c.orderDate,
        description: c.description,
        pdfUrl: c._id, // Store circular ID for download
        fileName: c.fileName,
        fileSize: c.fileSize,
        uploadedBy: c.uploadedBy,
        category: c.category || 'Education',
        createdAt: c.createdAt,
        status: c.status, // Include status field
        reviewNotes: c.reviewNotes // Include rejection notes
      }));
      
      setCirculars(mappedCirculars);
    } catch (error) {
      toast.error('Failed to load circulars');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (circular: Circular) => {
    try {
      if (!circular.pdfUrl || circular.pdfUrl.trim() === '') {
        toast.error('PDF is not available for download');
        return;
      }

      await api.downloadCircular(circular.pdfUrl, circular.fileName || 'circular.pdf');
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      toast.error(errorMsg);
    }
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
        selectedCircularForPreview.pdfUrl,
        selectedCircularForPreview.fileName || 'circular.pdf'
      );
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to download PDF';
      toast.error(errorMsg);
    }
  };

  const getCategoryCount = (category: string): number => {
    return circulars.filter((c) => c.category === category).length;
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
        title="Circular Nest"
        subtitle={user?.institutionName || user?.email}
        rightActions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
              <UserIcon className="w-4 h-4" />
              My Profile
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        }
      />

      {/* Main Content with Sidebar */}
      <main className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Category Navigation */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>Filter by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* All Categories Button */}
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  className="w-full justify-between h-auto py-2"
                  onClick={() => setSelectedCategory(null)}
                >
                  <span>All Categories</span>
                  <Badge variant="secondary">{circulars.length}</Badge>
                </Button>

                {/* Category Items */}
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
            {/* Header with Search and Button */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedCategory ? `${selectedCategory} Circulars` : 'All Circulars'}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedCategory
                      ? `Viewing ${selectedCategory} circulars`
                      : 'View and download all available circulars and notices'}
                  </p>
                </div>
                <Button onClick={() => navigate('/upload')} className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Circular for Review
                </Button>
              </div>
              
              {/* Search */}
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

            {/* Circulars Grid - Extra Small Cards */}
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
                        <Badge variant="outline" className="w-fit text-xs">
                          {circular.category}
                        </Badge>
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
                         {circular.status === 'rejected' && circular.reviewNotes && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                            <p className="font-semibold text-xs mb-1">Rejection Reason:</p>
                            <p className="text-xs break-words">{circular.reviewNotes}</p>
                          </div>
                        )}
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
      </main>

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
