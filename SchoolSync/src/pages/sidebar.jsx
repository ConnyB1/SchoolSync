import React from 'react';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
  ArrowLeftOnRectangleIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const { logout, isAuthenticated, user } = useAuth0();
  const location = useLocation();

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const navItems = [
    { name: 'Inicio', href: '/inicio', icon: HomeIcon },
    { name: 'Clases', href: '/clases', icon: BookOpenIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Calendario', href: '/calendario', icon: CalendarIcon },
    { name: 'Mensajes', href: '/mensajes', icon: EnvelopeIcon },
    { name: 'Documentos', href: '/documentos', icon: DocumentDuplicateIcon },
  ];

  return (
    <aside className="bg-gray-800 text-gray-100 w-20 flex flex-col items-center py-6 space-y-6 shadow-lg">
      <div className="text-indigo-400 font-bold text-sm">SSync</div>
      <nav className="flex flex-col items-center space-y-3 flex-grow">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            title={item.name}
            className={`p-3 rounded-xl hover:bg-gray-700 transition-colors ${
              location.pathname === item.href
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col items-center space-y-3">
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="p-3 rounded-xl text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            title="Cerrar Sesión"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
          </button>
        )}
        {isAuthenticated && user?.picture && (
          <img
            src={user.picture}
            alt="Perfil"
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        {isAuthenticated && !user?.picture && (
          <UserCircleIcon className="h-10 w-10 text-gray-400" />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;