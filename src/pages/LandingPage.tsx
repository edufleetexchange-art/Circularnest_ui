import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Shield, Download, Search, Clock, Zap, Menu } from 'lucide-react';
import ApprovedCircularsSection from '../components/ApprovedCircularsSection';
import { useAuth } from '../hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../components/ui/sheet';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-blue-200/30 to-transparent blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-cyan-200/30 to-transparent blur-3xl"></div>

      <header className="fixed top-0 left-0 right-0 w-full z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group transition-all duration-300 hover:scale-105"
            aria-label="Go to home"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              <img
                src="/image.png"
                alt="Circular Nest Logo"
                className="h-10 w-10 object-contain flex-shrink-0 relative z-10 transition-transform duration-300 group-hover:rotate-6"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
                Circular Nest
              </h1>
              <p className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                Circular Archive
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-2">
            <Button
              onClick={() => navigate('/guest-upload')}
              className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900"
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Circular
            </Button>
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="outline" onClick={() => {
                  logout();
                  navigate('/');
                }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Button
                    onClick={() => navigate('/guest-upload')}
                    className="w-full justify-start bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Upload Circular
                  </Button>
                  {user ? (
                    <>
                      <Button variant="ghost" onClick={() => navigate('/dashboard')} className="w-full justify-start">
                        Dashboard
                      </Button>
                      <Button variant="outline" onClick={() => {
                        logout();
                        navigate('/');
                      }} className="w-full justify-start">
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => navigate('/login')} className="w-full justify-start">
                        Login
                      </Button>
                      <Button onClick={() => navigate('/signup')} className="w-full justify-start">
                        Sign Up
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 md:py-24 pt-32 relative">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center animate-fade-in-up">
            <div className="mb-8 flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse-slow"></div>
                <img
                  src="/image.png"
                  alt="Circular Nest Logo"
                  className="h-40 w-40 object-contain relative z-10 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                />
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent animate-gradient-x">
              Your Circular Archive
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                in One Place
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Access and organize all your important circulars and notices in one secure location. Download what you need, when you need it—no hassle, no delays.
            </p>
          </div>

          {user && (
            <div className="mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:text-blue-600" />
                  <input
                    type="text"
                    placeholder="Search circulars by title, date, or description..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-xl hover:border-blue-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const searchQuery = (e.target as HTMLInputElement).value;
                        if (searchQuery.trim()) {
                          navigate(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
                        } else {
                          navigate('/dashboard');
                        }
                      }
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center font-medium">
                Press Enter to search your circulars
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4 items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex gap-4 justify-center flex-wrap">
              {user ? (
                <>
                  <Button size="lg" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/circulars')}>
                    View Circulars
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={() => navigate('/signup')}>
                    Register Now
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/circulars')}>
                    View Circulars
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => navigate('/login')}>
                    Already Have Access?
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 mb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent backdrop-blur-3xl rounded-3xl pointer-events-none"></div>
        <div className="relative text-center mb-12 animate-fade-in-up">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
            Why Choose Circular Nest?
          </h3>
          <p className="text-gray-700 text-lg">The easiest way to organize and access your circulars</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
          {[
            {
              icon: Download,
              title: 'One-Click Downloads',
              description: 'Download any circular instantly with all details preserved. No complicated navigation, just click and save.',
              color: 'from-blue-500 to-cyan-500',
              delay: '0s'
            },
            {
              icon: Search,
              title: 'Smart Search',
              description: 'Find circulars in seconds with intelligent filtering by date, category, and keywords.',
              color: 'from-cyan-500 to-teal-500',
              delay: '0.1s'
            },
            {
              icon: Clock,
              title: 'Always Updated',
              description: 'Never miss important notices. The latest circulars are available immediately.',
              color: 'from-teal-500 to-green-500',
              delay: '0.2s'
            },
            {
              icon: Shield,
              title: 'Secure Access',
              description: 'Your data is protected with secure authentication and role-based access control.',
              color: 'from-blue-600 to-blue-700',
              delay: '0.3s'
            },
            {
              icon: Zap,
              title: 'Fast & Reliable',
              description: 'Lightning-fast access with zero downtime. Your critical circulars are always available.',
              color: 'from-cyan-600 to-blue-600',
              delay: '0.4s'
            },
            {
              icon: FileText,
              title: 'Complete Information',
              description: 'Every notice includes title, date, category, and full description for context.',
              color: 'from-teal-600 to-cyan-600',
              delay: '0.5s'
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group border-2 border-white/50 bg-white/60 backdrop-blur-sm hover:bg-white/90 hover:border-blue-200 animate-fade-in-up"
                style={{ animationDelay: feature.delay }}
              >
                <CardHeader>
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg group-hover:shadow-2xl`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-700 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Latest Approved Circulars Section with View & Download */}
      <ApprovedCircularsSection />

      <section className="container mx-auto px-4 py-16 mb-16 relative">
        <div className="text-center mb-12 animate-fade-in-up">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
            Three Easy Steps
          </h3>
          <p className="text-gray-700 text-lg">Get access to all circulars in minutes</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: 'Register Your Account',
                description: 'Create an account to access the circular archive. It takes less than 2 minutes.',
                color: 'from-blue-500 to-cyan-500',
                delay: '0s'
              },
              {
                step: 2,
                title: 'Browse & Search Notices',
                description: 'Use smart search to find circulars by date, category, or keywords. Filter exactly what you need.',
                color: 'from-cyan-500 to-teal-500',
                delay: '0.1s'
              },
              {
                step: 3,
                title: 'Download & Use',
                description: 'Download PDFs instantly and keep them for your records. Access anytime, even offline.',
                color: 'from-teal-500 to-green-500',
                delay: '0.2s'
              }
            ].map((item) => (
              <Card
                key={item.step}
                className="group border-2 border-white/50 bg-white/60 backdrop-blur-sm hover:bg-white/90 hover:border-blue-200 animate-fade-in-up"
                style={{ animationDelay: item.delay }}
              >
                <CardContent className="pt-6">
                  <div className="flex gap-6">
                    <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                        {item.title}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 mb-16 animate-fade-in-up">
        <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 text-white border-0 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          <CardContent className="py-16 text-center relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
              Organize Your Circulars Today
            </h3>
            <p className="text-lg md:text-xl mb-8 opacity-95 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who trust Circular Nest to manage their circular archive effortlessly
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/signup')}
                className="shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Start Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-blue-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Already a Member?
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-white/20 bg-white/40 backdrop-blur-xl py-8 relative">
        <div className="container mx-auto px-4 text-center text-sm text-gray-700">
          <p className="font-medium">© 2025 Circular Nest. All rights reserved.</p>
          <p className="mt-2 text-gray-600">Circular Archive Management System</p>
        </div>
      </footer>
    </div>
  );
}
