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
import { Upload, FileText, CheckCircle2, AlertCircle, Info, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function SubmitNewCircular() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + Math.random() * 30;
          return next > 90 ? 90 : next;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || 'Untitled');
      formData.append('orderDate', orderDate || '');
      formData.append('description', description || '');
      formData.append('category', category || 'Education');
      formData.append('guestName', guestName || 'Anonymous');
      formData.append('guestEmail', guestEmail || '');

      await api.submitGuestUpload(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      toast.success('File submitted successfully! Admin will review and approve soon.');
      
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to submit file for review');
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

  // Generate navbar actions based on auth state
  const navbarActions = user ? (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
        Dashboard
      </Button>
      <Button 
        onClick={() => navigate('/upload')}
        size="sm"
        className="bg-purple-600 hover:bg-purple-700"
      >
        <FileText className="w-4 h-4 mr-2" />
        Upload Circular
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
        <LogIn className="w-4 h-4 mr-2" />
        Login
      </Button>
      <Button size="sm" onClick={() => navigate('/signup')}>
        <UserPlus className="w-4 h-4 mr-2" />
        Sign Up
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar 
        title="Submit New Circular" 
        subtitle="Upload circulars to our archive"
        rightActions={navbarActions}
      />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-lg mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Submit New Circular
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your circular with complete details. Our administrators will review and publish it for everyone to access.
            </p>
          </div>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You can upload circulars without creating an account. Your submission will be reviewed by an administrator before being published.
            </AlertDescription>
          </Alert>

          {uploadSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Upload Successful!</strong> Your circular has been submitted for admin review. 
                You can submit another circular or return to the home page.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Circular Details</CardTitle>
                  <CardDescription>
                    Fill in the information about your circular and upload the PDF file.
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

                  <form onSubmit={handleUpload} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Circular Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., New Academic Guidelines 2024"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">The main subject or heading of your circular</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orderDate">Order Date *</Label>
                      <Input
                        id="orderDate"
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        required
                        className="text-base"
                      />
                      <p className="text-xs text-muted-foreground">When was this circular issued?</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="text-base">
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
                      <p className="text-xs text-muted-foreground">Choose the most relevant category</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief summary of what this circular is about..."
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="text-base resize-none"
                      />
                      <p className="text-xs text-muted-foreground">A clear description helps users find relevant circulars</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file">PDF File * (Only PDF files allowed)</Label>
                      <div className="relative">
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
                          className="cursor-pointer text-base"
                        />
                      </div>
                      {file && (
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{file.name} • {formatFileSize(file.size)}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Maximum file size: 10MB. Only PDF format is supported.</p>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                      <h3 className="font-semibold text-sm">Your Details (Optional)</h3>
                      <p className="text-xs text-muted-foreground">
                        Provide your contact information so administrators can reach you if needed.
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="guestName">Your Name</Label>
                        <Input
                          id="guestName"
                          placeholder="e.g., John Doe"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="guestEmail">Your Email</Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          placeholder="e.g., john@example.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="text-base"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-6 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => navigate('/')}
                        disabled={uploading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploading} size="lg" className="gap-2">
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Submitting...' : 'Submit for Review'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">What to include:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Clear, descriptive title</li>
                      <li>✓ Correct issue date</li>
                      <li>✓ Relevant category</li>
                      <li>✓ Brief description</li>
                      <li>✓ PDF file (max 10MB)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Review Process</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">1</div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Submit</p>
                      <p>Upload your circular</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">2</div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Review</p>
                      <p>Admin reviews content</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">3</div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Publish</p>
                      <p>Published for all users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Have an Account?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {user ? (
                    <Button className="w-full" onClick={() => navigate('/dashboard')}>
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Create an account for faster uploads and tracking.</p>
                      <Button className="w-full" onClick={() => navigate('/signup')}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up Now
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Alert className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Ensure all details are accurate before submitting. 
              Once submitted, an administrator will review your circular. You can submit multiple circulars. 
              If you want to manage your submissions, consider creating an account.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Notice Nest. All rights reserved.</p>
          <p className="mt-2">Circular Archive Management System</p>
        </div>
      </footer>
    </div>
  );
}
