'use client';

import {
  Bell,
  FileText,
  GitBranch,
  LayoutDashboard,
  ScrollText,
  Server,
  Settings,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn, fetchAPI } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Talepler', icon: FileText },
  { href: '/admin/resources', label: 'Kaynaklar', icon: Server },
  { href: '/admin/allocations', label: 'Atamalar', icon: GitBranch },
  { href: '/admin/rules', label: 'Kurallar', icon: Settings },
  { href: '/admin/notifications', label: 'Bildirimler', icon: Bell },
  { href: '/admin/logs', label: 'Sistem Loglari', icon: ScrollText },
];

interface CityStatus {
  city: string;
  total: number;
  used: number;
  available: number;
  percentage: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const [cities, setCities] = useState<CityStatus[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await fetchAPI<{
          resourcesByCity: Record<string, { total: number; used: number; available: number }>;
        }>('/api/dashboard/summary');
        const cityList = Object.entries(data.resourcesByCity).map(([city, stats]) => ({
          city,
          total: stats.total,
          used: stats.used,
          available: stats.available,
          percentage: stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0,
        }));
        setCities(cityList);
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };

    fetchTeams();
    const interval = setInterval(fetchTeams, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-72 bg-gradient-to-b from-[#0065a1] to-[#004d7a] text-white flex flex-col">
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

      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm',
                    isActive
                      ? 'bg-white/20 text-[#ffc72c] font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Team Status Panel - By City */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#ffc72c]" />
          <span className="font-medium text-sm">Ekip Durumu</span>
        </div>
        <div className="space-y-2">
          {cities.map((city) => {
            const isOverloaded = city.percentage >= 100;
            const isBusy = city.percentage >= 50;
            return (
              <div key={city.city} className="bg-white/10 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full animate-pulse',
                        isOverloaded ? 'bg-red-400' : isBusy ? 'bg-yellow-400' : 'bg-green-400',
                      )}
                    />
                    <span className="text-sm font-medium">{city.city}</span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      isOverloaded ? 'text-red-300' : isBusy ? 'text-yellow-300' : 'text-green-300',
                    )}
                  >
                    {city.used}/{city.total}
                  </span>
                </div>
                <Progress
                  value={Math.min(city.percentage, 100)}
                  className={cn(
                    'h-1.5 rounded-full',
                    isOverloaded
                      ? '[&>div]:bg-red-400'
                      : isBusy
                        ? '[&>div]:bg-yellow-400'
                        : '[&>div]:bg-green-400',
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
