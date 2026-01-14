'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Server,
  GitBranch,
  Settings,
  Zap,
  Home,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Talepler', icon: FileText },
  { href: '/admin/resources', label: 'Kaynaklar', icon: Server },
  { href: '/admin/allocations', label: 'Atamalar', icon: GitBranch },
  { href: '/admin/rules', label: 'Kurallar', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-[#0065a1] to-[#004d7a] text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ffc72c] rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#0065a1]" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Smart Allocation</h1>
            <p className="text-xs text-white/60">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-white/20 text-[#ffc72c] font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10">
            <Home className="w-4 h-4 mr-2" />
            Kullanici Sayfasi
          </Button>
        </Link>
      </div>
    </aside>
  );
}
