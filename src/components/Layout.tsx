import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  fullHeight?: boolean; // Pour la page map, prendre toute la hauteur disponible
}

export default function Layout({ children, fullHeight = false }: LayoutProps) {
  if (fullHeight) {
    // Layout spécial pour la page map : header + content plein écran + footer
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </div>
    );
  }

  // Layout normal pour les autres pages
  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
