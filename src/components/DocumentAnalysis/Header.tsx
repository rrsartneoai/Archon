import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from './AuthWrapper';

export default function Header() {
  const { user, userRole, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-background border-b">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">📄 Platforma Analizy Dokumentów</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user?.email} ({userRole === 'CLIENT' ? 'Klient' : 'Operator'})
        </span>
        <Button variant="outline" size="sm" onClick={signOut}>
          Wyloguj
        </Button>
      </div>
    </header>
  );
}