import { Link } from 'react-router-dom';

const QuickAccessWidget = () => {
    const items = [
        { name: 'Divisi', path: '/hr/master-data/divisi', icon: 'domain' },
        { name: 'Departemen', path: '/hr/master-data/department', icon: 'groups' },
        { name: 'Jabatan', path: '/hr/master-data/posisi-jabatan', icon: 'badge' },
        { name: 'Level', path: '/hr/master-data/golongan', icon: 'stars' },
    ];

    return (
        <div className="bg-primary dark:bg-blue-900 rounded-xl p-6 text-white h-auto">
            <h3 className="text-lg font-bold mb-4">Akses Cepat Master Data</h3>
            <div className="grid grid-cols-2 gap-4">
                {items.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className="flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-lg backdrop-blur-sm"
                    >
                        <span className="material-symbols-outlined text-2xl mb-2">{item.icon}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default QuickAccessWidget;
