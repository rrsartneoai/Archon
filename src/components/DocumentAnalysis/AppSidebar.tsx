import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Settings, 
  Users, 
  BarChart3,
  CreditCard 
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from './AuthWrapper';

export default function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { userRole } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  const clientItems = [
    { title: "Moje Zlecenia", url: "/dashboard", icon: FileText },
    { title: "Nowe Zlecenie", url: "/create-order", icon: Plus },
  ];

  const operatorItems = [
    { title: "Panel Operatora", url: "/operator", icon: BarChart3 },
    { title: "Wszystkie Zlecenia", url: "/dashboard", icon: FileText },
  ];

  const items = userRole === 'OPERATOR' ? operatorItems : clientItems;

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible>
      <SidebarContent className="mt-14">
        <SidebarGroup>
          <SidebarGroupLabel>
            {userRole === 'OPERATOR' ? 'Panel Operatora' : 'Panel Klienta'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {userRole === 'OPERATOR' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administracja</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/users" className={getNavCls}>
                      <Users className="h-4 w-4" />
                      {state !== "collapsed" && <span>Użytkownicy</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/payments" className={getNavCls}>
                      <CreditCard className="h-4 w-4" />
                      {state !== "collapsed" && <span>Płatności</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/settings" className={getNavCls}>
                      <Settings className="h-4 w-4" />
                      {state !== "collapsed" && <span>Ustawienia</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}