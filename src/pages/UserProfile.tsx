import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { CATEGORIES } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  LogOut,
  Upload,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CircularUpload {
  id: string;
  title: string;
  orderDate: string;
  description: string;
  pdfUrl: string;
  fileName: string;
  fileSize: number;
  category: string;
  createdAt: string;
}

export default function UserProfile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [uploads, setUploads] = useState<CircularUpload[]>([]);

  const [profileData, setProfileData] = useState({
    institutionName: user?.institutionName || '',
    contactPerson: user?.contactPerson || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  const [uploadData, setUploadData] = useState({
    title: '',
    orderDate: '',
    description: '',
    category: 'Education',
    file: null as File | null,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        institutionName: user.institutionName || '',
        contactPerson: user.contactPerson || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadUserCirculars();
    // eslint-disable-next-line
  }, [user?.id]);

  const loadUserCirculars = async () => {
    try {
      const response = await api.getMySubmissions();
      if (response.success && response.submissions) {
        const approved = response.submissions
          .filter((c: any) => c.status === 'approved' && c.isPublished)
          .map((c: any) => ({
            id: c._id,
            title: c.title,
            orderDate: c.orderDate,
            description: c.description,
            pdfUrl: c.pdfUrl,
            fileName: c.fileName,
            fileSize: c.fileSize,
            category: c.category,
            createdAt: c.createdAt,
          }));
        setUploads(approved);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateUser(profileData);
    if (result !== false) {
      toast.success('Profile updated');
      setProfileDialogOpen(false);
    }
  };

  const handleCircularUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return toast.error('Select PDF');

    setUploading(true);
    setUploadProgress(30);

    const formData = new FormData();
    Object.entries(uploadData).forEach(([k, v]) => {
      if (v) formData.append(k, v as any);
    });

    const res = await api.submitPendingUpload(formData);
    if (res.success) {
      setUploadProgress(100);
      setUploadSuccess(true);
      toast.success('Submitted for review');
      setTimeout(() => {
        setUploadDialogOpen(false);
        loadUserCirculars();
      }, 1200);
    }
    setUploading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatSize = (b: number) =>
    b < 1024 * 1024
      ? (b / 1024).toFixed(1) + ' KB'
      : (b / 1024 / 1024).toFixed(1) + ' MB';

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">My Profile</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-all">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-2 w-full sm:w-fit">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="circulars">Circulars</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Manage your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(profileData).map(([k, v]) => (
                    <div key={k}>
                      <Label className="text-xs text-muted-foreground capitalize">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </Label>
                      <p className="font-medium">{v || 'Not set'}</p>
                    </div>
                  ))}
                </div>

                <Dialog
                  open={profileDialogOpen}
                  onOpenChange={setProfileDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="mt-6">Edit Profile</Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your details
                      </DialogDescription>
                    </DialogHeader>

                    <form
                      onSubmit={handleProfileUpdate}
                      className="space-y-4"
                    >
                      {Object.entries(profileData).map(([k, v]) => (
                        <div key={k}>
                          <Label className="capitalize">
                            {k.replace(/([A-Z])/g, ' $1')}
                          </Label>
                          <Input
                            value={v}
                            onChange={(e) =>
                              setProfileData({
                                ...profileData,
                                [k]: e.target.value,
                              })
                            }
                          />
                        </div>
                      ))}

                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setProfileDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Save</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CIRCULAR TAB */}
          <TabsContent value="circulars" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Circular</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog
                  open={uploadDialogOpen}
                  onOpenChange={setUploadDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Circular
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Upload Circular</DialogTitle>
                    </DialogHeader>

                    {uploading && (
                      <Progress value={uploadProgress} className="h-2" />
                    )}

                    <form
                      onSubmit={handleCircularUpload}
                      className="space-y-4"
                    >
                      <Input
                        placeholder="Title"
                        value={uploadData.title}
                        onChange={(e) =>
                          setUploadData({
                            ...uploadData,
                            title: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="date"
                        value={uploadData.orderDate}
                        onChange={(e) =>
                          setUploadData({
                            ...uploadData,
                            orderDate: e.target.value,
                          })
                        }
                      />
                      <Textarea
                        placeholder="Description"
                        value={uploadData.description}
                        onChange={(e) =>
                          setUploadData({
                            ...uploadData,
                            description: e.target.value,
                          })
                        }
                      />
                      <Select
                        value={uploadData.category}
                        onValueChange={(v) =>
                          setUploadData({ ...uploadData, category: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) =>
                          setUploadData({
                            ...uploadData,
                            file: e.target.files?.[0] || null,
                          })
                        }
                      />

                      <Button type="submit" disabled={uploading}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploads.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      {c.title}
                    </CardTitle>
                    <Badge variant="outline">{c.category}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="line-clamp-3">{c.description}</p>
                    <p>Order: {formatDate(c.orderDate)}</p>
                    <p>Size: {formatSize(c.fileSize)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
