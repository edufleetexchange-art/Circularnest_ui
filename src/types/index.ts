export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  institutionName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  createdAt: string;
}

export interface Circular {
  id: string;
  title: string;
  orderDate: string;
  description: string;
  pdfUrl: string;
  fileName: string;
  fileSize: number | string | null;
  uploadedBy: string;
  category: string;
  createdAt: string;
  isPublished?: number | string | boolean;
  isApprovedByAdmin?: boolean; // Track if circular was approved by admin from user submission
  status?: 'pending' | 'approved' | 'rejected'; // Status for filtering in admin dashboard
  reviewNotes?: string; // Admin notes for rejection or approval
}

export type CircularCategory = 
  | 'Education'
  | 'Fire Department'
  | 'PWD - Building Safety'
  | 'Transport'
  | 'Land Record'
  | 'Revenue';

export const CATEGORIES: CircularCategory[] = [
  'Education',
  'Fire Department',
  'PWD - Building Safety',
  'Transport',
  'Land Record',
  'Revenue',
];

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: 'admin' | 'user', institutionName?: string) => Promise<void>;
  logout: () => void;
}
