import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, ArrowRight, KeyRound, LayoutDashboard, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!username.trim() && !email.trim()) {
      toast.error("Ingresa usuario o correo para continuar");
      return;
    }

    setIsLoading(true);

    // Placeholder de UX hasta conectar el endpoint real de recuperación.
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
      toast.success("Solicitud registrada");
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-gradient-to-br from-primary via-primary to-accent overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div
          className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />

        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 text-white w-full h-full">
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

            <div className="space-y-6">
              <h2 className="text-6xl font-bold leading-tight">
                Recuperación<br />
                Segura de<br />
                <span className="bg-gradient-to-r from-white via-accent to-success bg-clip-text text-transparent">
                  Acceso
                </span>
              </h2>
              <p className="text-white/80 text-xl leading-relaxed max-w-lg">
                Solicita el restablecimiento de tu cuenta y vuelve al sistema de forma rápida y segura.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 lg:bg-none" />

        <Card className="w-full max-w-md relative z-10 shadow-2xl border border-border/50 bg-card/95 backdrop-blur-sm">
          <div className="h-2 bg-gradient-to-r from-primary via-accent to-success rounded-t-lg" />

          <CardHeader className="space-y-3 pb-6 pt-8">
            <CardTitle className="text-3xl font-bold text-foreground">¿Olvidaste tu clave?</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Ingresa tu usuario o correo y te ayudaremos a recuperar el acceso.
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8">
            {isSubmitted ? (
              <div className="space-y-6">
                <div className="p-4 bg-success/10 border border-success/20 rounded-xl">
                  <p className="text-sm text-success font-semibold">Solicitud enviada correctamente</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si existe una cuenta asociada, recibirás instrucciones de recuperación.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white h-11 font-bold"
                >
                  Volver al Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
                <div className="space-y-2.5">
                  <Label htmlFor="username" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="size-4 text-primary" />
                    Usuario de red
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="almac001"
                    className="h-12 bg-input-background border-input hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="size-4 text-primary" />
                    Correo
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@organirack.com"
                    className="h-12 bg-input-background border-input hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white h-12 font-bold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Procesando..." : (
                      <>
                        <KeyRound className="size-5" />
                        Solicitar recuperación
                        <ArrowRight className="size-5" />
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => navigate("/login")}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="size-4" />
                    Volver al login
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 p-4 bg-gradient-to-r from-muted/40 to-muted/60 rounded-xl border border-border/60">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
                  <Shield className="size-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground mb-1.5">Protección de Cuenta</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Esta pantalla es temporal: luego conectaremos el flujo real con backend y correo.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
