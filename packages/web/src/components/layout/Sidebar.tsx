import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Users,
  Building2,
  ListTodo,
  History,
  Trophy,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../contexts';

const navigation = [
  { name: 'Planejamento', href: '/', icon: Calendar },
  { name: 'Dashboard', href: '/dashboard', icon: Trophy },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Setores', href: '/setores', icon: Building2 },
  { name: 'Pessoas', href: '/pessoas', icon: Users },
  { name: 'Itens', href: '/itens', icon: ListTodo },
];

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 transition-colors">
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-dark-700">
        <Calendar className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        <span className="ml-3 text-xl font-bold text-gray-900 dark:text-gray-100">Planejamento</span>
      </div>

      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-700 dark:hover:text-gray-100'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-dark-700">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-dark-700 dark:hover:text-gray-100"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-5 h-5" />
              Modo Escuro
            </>
          ) : (
            <>
              <Sun className="w-5 h-5" />
              Modo Claro
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
