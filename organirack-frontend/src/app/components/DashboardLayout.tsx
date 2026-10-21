import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Package, Map, Menu, LogOut, Settings, Bell, Search, PackageSearch, Activity, FileText, BarChart3, Users, X, HelpCircle } from "lucide-react";
import { useRef, useState, type WheelEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { clearAuthSession, getAuthUser } from "../lib/auth";

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const authUser = getAuthUser();
  const displayedName = authUser?.name || "Usuario";
  const displayedEmail = authUser?.email || authUser?.username || "Sin correo";
  const avatarFallback = displayedName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { path: "/inventario", label: "Inventario Global", icon: BarChart3 },
    { path: "/productos", label: "Gestión de Productos", icon: Package },
    { path: "/surtidos", label: "Salidas de Inventario", icon: PackageSearch },
    { path: "/mapa", label: "Mapa de Almacén", icon: Map },
    { path: "/usuarios", label: "Gestión de Usuarios", icon: Users },
    { path: "/auditoria", label: "Bitácora de Auditoría", icon: FileText },
  ];

  const handleLogout = () => {
    clearAuthSession();
    toast.success("Sesión cerrada correctamente");
    navigate("/login");
  };

  const handleGlobalSearch = (query: string) => {
    if (!query.trim()) {
      toast.error("Por favor ingresa un término de búsqueda");
      return;
    }
    // Navega a Inventario Global con búsqueda y cierra notificaciones
    navigate(`/inventario?search=${encodeURIComponent(query)}`);
    setGlobalSearch("");
    setShowNotifications(false);
  };

  const handleOpenSettings = () => {
    // Abre la configuración del usuario
    toast.info("Configuración abierta", { description: "Página en desarrollo" });
    setShowSettings(true);
  };

  const mockNotifications = [
    { id: 1, title: "Inventario bajo", message: "RACK-A001 stock crítico", time: "hace 5 min", type: "alert" },
    { id: 2, title: "Sincronización exitosa", message: "Último sync: hace 2 horas", time: "hace 2h", type: "success" },
    { id: 3, title: "Nueva orden", message: "Orden #2024-001 creada", time: "hace 1h", type: "info" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out overflow-hidden flex flex-col shadow-2xl border-r border-border/40 z-20`}
      >
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3 border-b border-border/40 bg-gradient-to-br from-primary/5 via-accent/5 to-success/5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-lg blur-md opacity-50" />
            <div className="relative bg-gradient-to-br from-primary via-accent to-success p-2 rounded-lg shadow-lg">
              <LayoutDashboard className="size-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-foreground font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              OrganiRack<span className="text-accent">+</span>
            </h1>
            <p className="text-muted-foreground text-xs font-medium">Sistema Empresarial</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Módulos Principales
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/20 font-semibold"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                }`}
              >
                {/* Active Indicator Glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-50" />
                )}
                
                <Icon className={`size-5 flex-shrink-0 transition-colors relative z-10 ${
                  isActive ? "text-white drop-shadow" : "text-muted-foreground group-hover:text-primary"
                }`} />
                <span className="whitespace-nowrap relative z-10">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-accent animate-pulse shadow-lg shadow-accent/50 relative z-10" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Footer */}
        <div className="p-4 border-t border-border/40 bg-gradient-to-br from-muted/30 to-transparent">
          <div 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 hover:border-destructive/20 border border-transparent transition-all cursor-pointer group"
          >
            <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-md">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold text-xs">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{displayedName}</p>
              <p className="text-xs text-muted-foreground truncate">{displayedEmail}</p>
            </div>
            <LogOut className="size-4 text-muted-foreground group-hover:text-destructive transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 min-h-0 flex flex-col overflow-hidden relative"
      >
        {/* Header with Glassmorphism */}
        <header className="bg-card/95 backdrop-blur-xl border-b border-border/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 hover:shadow-md"
              aria-label="Toggle sidebar"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-foreground hidden sm:block">
                {navItems.find((item) => item.path === location.pathname)?.label || "Dashboard"}
              </h2>
              <p className="text-xs text-muted-foreground hidden md:block">
                Gestión centralizada de inventario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex relative items-center gap-2">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Búsqueda global..." 
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGlobalSearch(globalSearch)}
                  className="pl-9 h-10 bg-muted/50 border-input hover:border-primary/30 focus-visible:ring-primary/20 transition-all"
                />
              </div>
              {/* Search Help Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                  onMouseEnter={() => setShowSearchHelp(true)}
                  onMouseLeave={() => setShowSearchHelp(false)}
                  title="Ver ayuda sobre búsqueda global"
                >
                  <HelpCircle className="size-4" />
                </Button>
                {/* Search Help Tooltip */}
                {showSearchHelp && (
                  <div className="absolute right-0 top-12 bg-popover border border-input rounded-lg shadow-lg p-3 w-56 text-xs text-popover-foreground z-50">
                    <p className="font-semibold mb-2 text-info">Cómo usar la búsqueda global:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Busca por <strong>SKU</strong> del producto</li>
                      <li>• Busca por <strong>nombre</strong> del producto</li>
                      <li>• Presiona <strong>Enter</strong> para ejecutar</li>
                      <li>• Te llevará al Inventario Global con filtros aplicados</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={() => setShowNotifications(!showNotifications)}
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-accent hover:bg-accent/10 relative transition-all"
            >
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-card shadow-lg shadow-accent/50 animate-pulse"></span>
            </Button>
            
            <Button 
              onClick={handleOpenSettings}
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Settings className="size-5" />
            </Button>
            
            <div className="h-6 w-px bg-border mx-1"></div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-success/10 to-success/5 text-success rounded-full text-xs font-semibold border border-success/30 shadow-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success shadow-lg shadow-success/50"></span>
              </span>
              Sistema Operativo
            </div>
          </div>
        </header>

        {/* Notificaciones Dropdown */}
        {showNotifications && (
          <div className="absolute top-20 right-6 w-80 bg-card border border-border/50 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30">
              <h3 className="font-semibold text-foreground">Notificaciones</h3>
              <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {mockNotifications.map((notif) => (
                <div key={notif.id} className="px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      notif.type === 'alert' ? 'bg-destructive' : 
                      notif.type === 'success' ? 'bg-success' : 'bg-info'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{notif.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border/40 bg-muted/20">
              <Button variant="ghost" size="sm" className="w-full text-xs text-primary hover:bg-primary/10">
                Ver todas las notificaciones
              </Button>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute top-24 right-6 w-80 bg-card border border-border/50 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Settings className="size-4" />
                Configuración
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Perfil</p>
                <p className="text-xs text-muted-foreground">{displayedName}</p>
                <p className="text-xs text-muted-foreground">{displayedEmail}</p>
              </div>
              <div className="h-px bg-border/40"></div>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Ayuda
              </Button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main ref={mainScrollRef} className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}