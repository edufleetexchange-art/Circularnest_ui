import { useNavigate } from 'react-router-dom';
import { Bell, FileText, Menu } from 'lucide-react';
import Logo from './Logo.tsx';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';

interface NavbarProps {
  title?: string;
  subtitle?: string;
  rightActions?: React.ReactNode;
}

export default function Navbar({ title, subtitle, rightActions }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Logo with integrated branding */}
          <button
            onClick={() => navigate('/')}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <Logo size="md" />
          </button>

          {/* Optional Page Title (for specific pages) */}
          {title && (
            <div className="hidden sm:block border-l pl-4 min-w-0">
              <h2 className="text-base font-semibold truncate text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {/* View Circulars Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/circulars')}
            className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-accent"
            aria-label="View Circulars"
            title="View all circulars"
          >
            <FileText className="w-5 h-5 text-foreground" />
          </Button>

          {/* Circular Notification Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-accent"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground" />
          </Button>

          {/* Additional Right Actions */}
          {rightActions && (
            <div className="flex items-center gap-2">
              {rightActions}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/circulars')} 
                  className="justify-start w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Circulars
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                
                {rightActions && (
                  <div className="flex flex-col gap-2 pt-4 border-t [&>div]:flex-col [&>div]:items-stretch [&>div]:gap-2 [&_button]:w-full [&_button]:justify-start [&_span]:!inline">
                    {rightActions}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
