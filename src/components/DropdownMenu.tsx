import { useState, useRef, useEffect } from 'react';

type DropdownMenuProps = {
  children: React.ReactNode;
  trigger: React.ReactNode;
};

export default function DropdownMenu({ children, trigger }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

type DropdownMenuItemProps = {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function DropdownMenuItem({ onClick, children, icon, className = '' }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-white ${className}`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}