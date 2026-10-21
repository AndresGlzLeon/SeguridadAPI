import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  UserPlus,
  UserCog,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import axiosInstance from "../lib/axios";

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role?: string; // Ahora viene del backend puede variar
  roles?: { id: number; name: string }[];
  isActive?: boolean;
  is_active?: number; // Campo del BD Laravel
  emailVerified?: boolean;
  email_verified_at?: string;
  createdAt?: string;
  created_at?: string;
  lastLogin?: string;
}

export function GestionUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
    name: "",
    email: "",
    username: "",
    role: "Almacenista",
    isActive: true,
    password: "",
  });

  // Cargar usuarios del backend
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/users');

        // Transformar datos del backend al formato del frontend
        const usersData: User[] = Array.isArray(response.data)
          ? response.data
          : response.data.data || [];

        const transformedUsers = usersData.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.roles?.[0]?.name || user.role || "Usuario",
          isActive: user.is_active ? true : (user.isActive || false),
          emailVerified: user.email_verified_at ? true : (user.emailVerified || false),
          createdAt: user.created_at ? user.created_at.split('T')[0] : (user.createdAt || ""),
          lastLogin: user.last_login_at
            ? user.last_login_at.split('T')[0]
            : (user.created_at ? user.created_at.split('T')[0] : "Nunca"),
        }));

        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        toast.error('Error al cargar usuarios del sistema');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "todos" || user.role === filterRole;
    const matchStatus =
      filterStatus === "todos" ||
      (filterStatus === "activo" && user.isActive) ||
      (filterStatus === "inactivo" && !user.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        password: "",
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        username: "",
        role: "Almacenista",
        isActive: true,
        password: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validaciones básicas
    if (!formData.name || !formData.email || !formData.username) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error("La contraseña es obligatoria para nuevos usuarios");
      return;
    }

    try {
      if (editingUser) {
        // Actualizar usuario existente
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          username: formData.username,
          role: formData.role,
          is_active: formData.isActive,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await axiosInstance.put(`/users/${editingUser.id}`, updateData);

        // Recargar usuarios del backend
        const response = await axiosInstance.get('/users');
        const usersData = Array.isArray(response.data) ? response.data : response.data.data || [];
        const transformedUsers = usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.roles?.[0]?.name || user.role || "Usuario",
          isActive: user.is_active ? true : false,
          emailVerified: user.email_verified_at ? true : false,
          createdAt: user.created_at ? user.created_at.split('T')[0] : "",
          lastLogin: user.last_login_at
            ? user.last_login_at.split('T')[0]
            : (user.created_at ? user.created_at.split('T')[0] : "Nunca"),
        }));
        setUsers(transformedUsers);

        toast.success("Usuario actualizado correctamente");
      } else {
        // Crear nuevo usuario
        const newUserData = {
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          is_active: formData.isActive,
        };

        await axiosInstance.post('/users', newUserData);

        // Recargar usuarios del backend
        const response = await axiosInstance.get('/users');
        const usersData = Array.isArray(response.data) ? response.data : response.data.data || [];
        const transformedUsers = usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.roles?.[0]?.name || user.role || "Usuario",
          isActive: user.is_active ? true : false,
          emailVerified: user.email_verified_at ? true : false,
          createdAt: user.created_at ? user.created_at.split('T')[0] : "",
          lastLogin: user.last_login_at
            ? user.last_login_at.split('T')[0]
            : (user.created_at ? user.created_at.split('T')[0] : "Nunca"),
        }));
        setUsers(transformedUsers);

        toast.success("Usuario creado correctamente", {
          description: "Se ha enviado un correo de verificación"
        });
      }
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      const errorMsg = error.response?.data?.message || "Error al guardar usuario";
      const errors = error.response?.data?.errors;

      if (errors) {
        const errorDetails = Object.values(errors).flat().join(', ');
        toast.error(errorMsg, { description: errorDetails as string });
      } else {
        toast.error(errorMsg);
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await axiosInstance.patch(`/users/${id}/toggle-status`);

      // Recargar usuarios del backend
      const response = await axiosInstance.get('/users');
      const usersData = Array.isArray(response.data) ? response.data : response.data.data || [];
      const transformedUsers = usersData.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.roles?.[0]?.name || user.role || "Usuario",
        isActive: user.is_active ? true : false,
        emailVerified: user.email_verified_at ? true : false,
        createdAt: user.created_at ? user.created_at.split('T')[0] : "",
        lastLogin: user.last_login_at
          ? user.last_login_at.split('T')[0]
          : (user.created_at ? user.created_at.split('T')[0] : "Nunca"),
      }));
      setUsers(transformedUsers);

      const user = transformedUsers.find((u) => u.id === id);
      toast.success(
        user?.isActive
          ? "Usuario activado correctamente"
          : "Usuario desactivado correctamente"
      );
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      const errorMsg = error.response?.data?.message || "Error al cambiar estado del usuario";
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      try {
        await axiosInstance.delete(`/users/${id}`);

        // Recargar usuarios del backend
        const response = await axiosInstance.get('/users');
        const usersData = Array.isArray(response.data) ? response.data : response.data.data || [];
        const transformedUsers = usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.roles?.[0]?.name || user.role || "Usuario",
          isActive: user.is_active ? true : false,
          emailVerified: user.email_verified_at ? true : false,
          createdAt: user.created_at ? user.created_at.split('T')[0] : "",
          lastLogin: user.last_login_at
            ? user.last_login_at.split('T')[0]
            : (user.created_at ? user.created_at.split('T')[0] : "Nunca"),
        }));
        setUsers(transformedUsers);

        toast.success("Usuario eliminado correctamente");
      } catch (error: any) {
        console.error('Error al eliminar usuario:', error);
        const errorMsg = error.response?.data?.message || "Error al eliminar usuario";
        toast.error(errorMsg);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Jefe de Almacen":
        return (
          <Badge className="bg-error/20 text-error border-error/30 gap-1.5 font-semibold">
            <Shield className="size-3" />
            Jefe de Almacén
          </Badge>
        );
      case "Gerencia de Operaciones":
        return (
          <Badge className="bg-purple/20 text-purple border-purple/30 gap-1.5 font-semibold">
            <UserCog className="size-3" />
            Gerencia de Operaciones
          </Badge>
        );
      case "Almacenista":
        return (
          <Badge className="bg-accent/20 text-accent border-accent/30 gap-1.5 font-normal">
            <Users className="size-3" />
            Almacenista
          </Badge>
        );
      case "Capturista":
        return (
          <Badge className="bg-info/20 text-info border-info/30 gap-1.5 font-normal">
            <Users className="size-3" />
            Capturista
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple to-accent bg-clip-text text-transparent">
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Control de perfiles, roles y permisos del sistema
          </p>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-300" />
          <Button
            onClick={() => handleOpenDialog()}
            className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-xl"
          >
            <UserPlus className="size-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card className="border border-primary/20 shadow-xl bg-gradient-to-br from-card to-primary/5 overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Total Usuarios
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border border-success/20 shadow-xl bg-gradient-to-br from-card to-success/5 overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl group-hover:bg-success/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Usuarios Activos
            </CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle2 className="size-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold bg-gradient-to-br from-success to-success/70 bg-clip-text">
              {users.filter((u) => u.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Con acceso al sistema
            </p>
          </CardContent>
        </Card>

        <Card className="border border-error/20 shadow-xl bg-gradient-to-br from-card to-error/5 overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-2xl group-hover:bg-error/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Jefes de Almacén
            </CardTitle>
            <div className="p-2 bg-error/10 rounded-lg">
              <Shield className="size-5 text-error" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-error">
              {users.filter((u) => u.role === "Jefe de Almacen").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Acceso completo
            </p>
          </CardContent>
        </Card>

        <Card className="border border-info/20 shadow-xl bg-gradient-to-br from-card to-info/5 overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-info/10 rounded-full blur-2xl group-hover:bg-info/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Personal de Operaciones
            </CardTitle>
            <div className="p-2 bg-info/10 rounded-lg">
              <Users className="size-5 text-info" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-info">
              {users.filter((u) => u.role === "Almacenista" || u.role === "Capturista").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Almacenistas y Capturistas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Usuarios */}
      <Card className="border border-border shadow-xl overflow-hidden bg-card">
        <div className="h-1.5 bg-gradient-to-r from-primary via-purple to-accent"></div>
        <CardHeader className="bg-gradient-to-br from-muted/30 to-transparent border-b border-border">
          <CardTitle className="text-xl text-foreground flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="size-6 text-primary" />
            </div>
            Directorio de Usuarios
          </CardTitle>
          <CardDescription className="mt-1.5">
            Gestión de accesos y permisos del personal
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-12 gap-3">
              <Loader2 className="size-6 text-primary animate-spin" />
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && users.length === 0 && (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </div>
          )}

          {/* Filtros y Tabla */}
          {!loading && users.length > 0 && (
            <>
              {/* Filtros */}
              <div className="p-5 border-b border-border bg-card">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[250px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, email o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </div>

                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[180px] border-border">
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los roles</SelectItem>
                      <SelectItem value="Jefe de Almacen">Jefe de Almacén</SelectItem>
                      <SelectItem value="Gerencia de Operaciones">Gerencia de Operaciones</SelectItem>
                      <SelectItem value="Almacenista">Almacenista</SelectItem>
                      <SelectItem value="Capturista">Capturista</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px] border-border">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="activo">Activos</SelectItem>
                      <SelectItem value="inactivo">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                      <TableHead className="font-semibold text-foreground">Nombre</TableHead>
                      <TableHead className="font-semibold text-foreground">Email</TableHead>
                      <TableHead className="font-semibold text-foreground">Usuario</TableHead>
                      <TableHead className="font-semibold text-foreground">Rol</TableHead>
                      <TableHead className="font-semibold text-foreground">Estado</TableHead>
                      <TableHead className="font-semibold text-foreground">Último Acceso</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, index) => (
                      <TableRow
                        key={user.id}
                        className={`group transition-colors hover:bg-muted/50 ${index % 2 === 0 ? "bg-card" : "bg-muted/20"
                          }`}
                      >
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
                              {user.name.charAt(0)}
                            </div>
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {user.username}
                          </code>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-success/20 text-success border-success/30 gap-1 font-normal">
                              <CheckCircle2 className="size-3" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground border-border gap-1 font-normal">
                              <XCircle className="size-3" />
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLogin || "Nunca"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(user)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-warning hover:bg-warning/10"
                            >
                              {user.isActive ? (
                                <Lock className="size-4" />
                              ) : (
                                <Unlock className="size-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 border-t border-border bg-card text-sm text-muted-foreground">
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              Complete la información del usuario. Los campos marcados son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez González"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@organirack.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario *</Label>
                <Input
                  id="username"
                  placeholder="jperez"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jefe de Almacen">Jefe de Almacén</SelectItem>
                    <SelectItem value="Gerencia de Operaciones">Gerencia de Operaciones</SelectItem>
                    <SelectItem value="Almacenista">Almacenista</SelectItem>
                    <SelectItem value="Capturista">Capturista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUser ? "Nueva Contraseña (opcional)" : "Contraseña *"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4 text-muted-foreground" />
                    ) : (
                      <Eye className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  La contraseña será encriptada con Bcrypt
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.isActive ? "activo" : "inactivo"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, isActive: value === "activo" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {editingUser ? "Actualizar" : "Crear"} Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
