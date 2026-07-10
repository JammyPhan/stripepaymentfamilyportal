import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import type { View } from '../types';

interface NavItem {
  label: string;
  view?: View;
  hasDropdown?: boolean;
  dropdownItems?: { label: string; view: View }[];
}

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Home', view: { name: 'home' } },
    {
      label: 'Portal',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Patient Onboarding', view: { name: 'onboarding' } },
        { label: 'Clinician Dashboard', view: { name: 'admin' } },
      ],
    },
    { label: 'Clinician', view: { name: 'admin' } },
  ];

  const isActive = (item: NavItem) => {
    if (!item.view) return false;
    return item.view.name === currentView.name;
  };

  const handleNavClick = (view: View) => {
    onNavigate(view);
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  return (
    <div className="absolute left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 px-0 sm:top-8">
      <nav className="flex items-center justify-between rounded-full bg-charcoal px-4 py-3 sm:px-6">
        <button onClick={() => handleNavClick({ name: 'home' })} className="flex-shrink-0 transition-transform duration-150 ease-brand hover:scale-[1.02]">
          <Logo dark />
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              {item.hasDropdown ? (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-cream-100 transition-colors duration-150 ease-brand hover:text-white"
                  >
                    {item.label}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ease-brand ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute left-1/2 top-full mt-2 w-56 -translate-x-1/2 rounded-2xl bg-white p-2 border border-neutral-border animate-scale-in">
                      {item.dropdownItems?.map((di) => (
                        <button
                          key={di.label}
                          onClick={() => handleNavClick(di.view)}
                          className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium text-body transition-colors duration-150 ease-brand hover:bg-cream-100 hover:text-primary-500"
                        >
                          {di.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => item.view && handleNavClick(item.view)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ease-brand ${
                    isActive(item) ? 'text-white' : 'text-cream-100 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <button
            onClick={() => handleNavClick({ name: 'onboarding' })}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-brand hover:bg-primary-400"
          >
            Get in touch
          </button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-cream-100 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="mt-2 rounded-2xl bg-charcoal p-4 animate-slide-down lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.hasDropdown ? (
                <div key={item.label} className="flex flex-col gap-1">
                  <span className="px-4 py-2 text-sm font-medium text-cream-100">{item.label}</span>
                  {item.dropdownItems?.map((di) => (
                    <button
                      key={di.label}
                      onClick={() => handleNavClick(di.view)}
                      className="rounded-xl px-4 py-2 text-left text-sm font-medium text-cream-100/80 hover:text-white"
                    >
                      {di.label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  key={item.label}
                  onClick={() => item.view && handleNavClick(item.view)}
                  className="rounded-xl px-4 py-2 text-left text-sm font-medium text-cream-100 hover:text-white"
                >
                  {item.label}
                </button>
              ),
            )}
            <button
              onClick={() => handleNavClick({ name: 'onboarding' })}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white"
            >
              Get in touch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
