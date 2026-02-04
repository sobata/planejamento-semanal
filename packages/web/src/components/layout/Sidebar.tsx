import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Users,
  Building2,
  ListTodo,
  History,
} from 'lucide-react';

const navigation = [
  { name: 'Planejamento', href: '/', icon: Calendar },
  { name: 'Histórico', href: '/historico', icon: History },
  { name: 'Setores', href: '/setores', icon: Building2 },
  { name: 'Pessoas', href: '/pessoas', icon: Users },
  { name: 'Itens', href: '/itens', icon: ListTodo },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <Calendar className="w-8 h-8 text-primary-600" />
        <span className="ml-3 text-xl font-bold text-gray-900">Planejamento</span>
      </div>

      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
