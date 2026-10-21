import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { LayoutDashboard, Lock, Mail, Eye, EyeOff, Shield, Zap, TrendingUp, Package, Users, BarChart3, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { isAuthenticated, loginRequest, saveAuthSession } from "../lib/auth";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;
    
    if (!username || !password) {
      toast.error("Por favor ingresa usuario y contraseña");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginRequest({ username: username.trim(), password });
      saveAuthSession(response.token, response.user);
      toast.success(response.message || "Login exitoso");
      navigate("/");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Credenciales incorrectas";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-gradient-to-br from-primary via-primary to-accent overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-success/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 text-white w-full h-full">
          {/* Logo & Title */}
          <div className="space-y-8 max-w-2xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-2xl blur-xl opacity-40" />
                <div className="relative bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-2xl">
                  <LayoutDashboard className="size-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  OrganiRack<span className="text-accent">+</span>
                </h1>
                <p className="text-white/80 text-sm font-medium mt-1">Enterprise Warehouse System</p>
              </div>
            </div>

            {/* Main Message */}
            <div className="space-y-6">
              <h2 className="text-6xl font-bold leading-tight">
                Gestión de<br />
                Almacenes<br />
                <span className="bg-gradient-to-r from-white via-accent to-success bg-clip-text text-transparent">
                  Inteligente
                </span>
              </h2>
              <p className="text-white/80 text-xl leading-relaxed max-w-lg">
                Control total de inventario, picking optimizado y análisis en tiempo real
                para maximizar la eficiencia de tu operación.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background Effects for Mobile/Right Panel */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 lg:bg-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tl from-success/10 to-info/10 rounded-full blur-3xl" />
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md relative z-10 shadow-2xl border border-border/50 bg-card/95 backdrop-blur-sm">
          {/* Top Accent */}
          <div className="h-2 bg-gradient-to-r from-primary via-accent to-success rounded-t-lg" />

          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden p-8 pb-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br from-primary via-primary to-accent p-4 rounded-2xl shadow-lg">
                  <LayoutDashboard className="size-10 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              OrganiRack<span className="text-accent">+</span>
            </h1>
          </div>

          <CardHeader className="space-y-3 pb-6 pt-8">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-foreground">
                Bienvenido de nuevo
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </div>
                <span className="text-xs font-semibold text-success">Sistema Activo</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <Shield className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Conexión Segura</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            <form onSubmit={handleLogin} className="space-y-5" autoComplete="on">
              {/* Email */}
              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  Usuario de red
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="almacenista01"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="relative pl-4 pr-4 h-12 bg-input-background border-input hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all text-base"
                    disabled={isLoading}
                    autoComplete="username"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="size-4 text-primary" />
                  Clave de seguridad
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative pl-4 pr-12 h-12 bg-input-background border-input hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all text-base"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors z-10"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-accent hover:text-accent/80 transition-colors font-semibold"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>

              {/* Login Button */}
              <div className="pt-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-lg blur-lg opacity-40 group-hover:opacity-70 transition duration-300 animate-pulse" style={{ animationDuration: '3s' }} />
                  <Button
                    type="submit"
                    className="relative w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl h-13 font-bold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Autorizando acceso...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap className="size-5" />
                        Acceder al Sistema
                        <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Security Info */}
            <div className="mt-6 p-4 bg-gradient-to-r from-muted/40 to-muted/60 rounded-xl border border-border/60">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
                  <Shield className="size-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground mb-1.5">
                    🔒 Conexión Segura Verificada
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tu sesión expirará automáticamente en <span className="text-primary font-semibold">2 horas</span> de inactividad.
                  </p>
                </div>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="mt-5 text-center p-3 bg-info/5 border border-info/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1.5 font-semibold">
                🎯 Credenciales de Acceso
              </p>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="font-mono text-foreground font-semibold bg-card px-2 py-1 rounded border border-border">
                  almac001
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="font-mono text-foreground font-semibold bg-card px-2 py-1 rounded border border-border">
                  password
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-xs text-muted-foreground/80">
            © 2026 OrganiRack+ | Sistema Empresarial de Gestión de Inventario
          </p>
        </div>
      </div>
    </div>
  );
}