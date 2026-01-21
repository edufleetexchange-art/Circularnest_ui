import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CATEGORIES } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function GuestUpload() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [title, setTitle] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Education');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);

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
      formData.append('guestName', guestName || 'Anonymous');
      formData.append('guestEmail', guestEmail || '');

      // Use dedicated guest upload endpoint (no authentication required)
      await api.submitGuestUpload(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      toast.success('File submitted successfully! Admin will review and approve soon.');
      
      // Reset form after brief delay
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Extract and display specific error message
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to submit file for review';
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setOrderDate('');
    setDescription('');
    setCategory('Education');
    setGuestName('');
    setGuestEmail('');
    setFile(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    // Reset file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Navbar title="Upload Circular" subtitle="Submit for review" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Info Alert */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            You can upload circulars without creating an account. Your submission will be reviewed by an administrator before being published.
          </AlertDescription>
        </Alert>

        {/* Upload Success Message */}
        {uploadSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Upload Successful!</strong> Your circular has been submitted for admin review. 
              You can submit another circular or return to the home page.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Submit New Circular</CardTitle>
            <CardDescription>
              Fill in the details and upload the PDF file. An administrator will review it before publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploading && uploadProgress > 0 && (
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Uploading...</p>
                  <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Circular Details */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-sm">Circular Details</h3>
                
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
              </div>

              {/* Your Details (Optional) */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-sm">Your Details <span className="text-muted-foreground font-normal">(Optional)</span></h3>
                <p className="text-xs text-muted-foreground">
                  Provide your contact information so admin can reach you if needed. You can skip this section and submit anonymously.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="guestName">Your Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="guestName"
                    placeholder="e.g., John Doe (or leave blank for anonymous)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Your Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    placeholder="e.g., john@example.com (or leave blank)"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* File Upload */}
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

              {/* Submit Buttons */}
              <div className="flex gap-2 justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Once submitted, your circular will be reviewed by an administrator. 
            You'll be able to see published circulars on the home page once approved. 
            If you want to track your submissions, consider creating an account.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
