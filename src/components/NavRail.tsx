'use client';

import { useEffect, useState } from 'react';
import { Scale, Folder, Settings, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  currentView: string;
  onViewChange: (v: 'list' | 'builder') => void;
  onOpenSettings?: () => void;
}

function NavItem({
  icon,
  active,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const disabled = !onClick;
  return (
    <button
      type="button"
      title={title ?? (disabled ? '준비 중' : undefined)}
      aria-label={title}
      aria-current={active ? 'page' : undefined}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onClick}
      className={`relative w-full h-10 flex items-center justify-center bg-transparent border-0 p-0
        ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
        ${active ? 'text-f-accent' : 'text-f-t4'}
        ${!disabled && !active ? 'hover:text-f-t3' : ''}
        transition-colors`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-2 bottom-2 w-0.5 bg-f-accent rounded-r-sm"
        />
      )}
      <span className="p-1.5">{icon}</span>
    </button>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && theme === 'dark';
  return (
    <span suppressHydrationWarning className="block w-full">
      <NavItem
        icon={mounted ? (isDark ? <Sun size={18} /> : <Moon size={18} />) : <Moon size={18} />}
        title={mounted ? (isDark ? '라이트 모드로 전환' : '다크 모드로 전환') : '테마 전환'}
        onClick={toggleTheme}
      />
    </span>
  );
}

export default function NavRail({ currentView, onViewChange, onOpenSettings }: Props) {
  return (
    <div className="w-12 bg-f-surface border-r border-f-border flex flex-col items-center py-3 select-none z-20 shrink-0">
      <NavItem
        icon={<Scale size={18} />}
        title="작업 화면"
        active={currentView === 'builder'}
        onClick={() => onViewChange('builder')}
      />
      <div className="h-2" />
      <NavItem
        icon={<Folder size={18} />}
        title="케이스 목록"
        active={currentView === 'list'}
        onClick={() => onViewChange('list')}
      />
      <div className="mt-auto w-full flex flex-col pt-3 border-t border-f-border">
        <ThemeToggle />
        <NavItem
          icon={<Settings size={18} />}
          title="설정"
          onClick={onOpenSettings}
        />
        <NavItem icon={<User size={18} />} />
      </div>
    </div>
  );
}
