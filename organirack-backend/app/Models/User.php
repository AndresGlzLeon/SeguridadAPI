<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, LogsActivity;
    use HasRoles {
        assignRole as spatieAssignRole;
        syncRoles as spatieSyncRoles;
        removeRole as spatieRemoveRole;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username', // Campo para el ID de acceso
        'email',
        'password',
        'is_active', // Permitir activar/desactivar
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('user')
            ->logOnly(['name', 'username', 'email', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $eventName) => "Usuario {$eventName}");
    }

    public function assignRole(...$roles)
    {
        $previousRoles = $this->getRoleNames()->sort()->values()->all();
        $result = $this->spatieAssignRole(...$roles);
        $this->logRoleChange($previousRoles, 'assignRole');

        return $result;
    }

    public function syncRoles(...$roles)
    {
        $previousRoles = $this->getRoleNames()->sort()->values()->all();
        $result = $this->spatieSyncRoles(...$roles);
        $this->logRoleChange($previousRoles, 'syncRoles');

        return $result;
    }

    public function removeRole($role)
    {
        $previousRoles = $this->getRoleNames()->sort()->values()->all();
        $result = $this->spatieRemoveRole($role);
        $this->logRoleChange($previousRoles, 'removeRole');

        return $result;
    }

    private function logRoleChange(array $previousRoles, string $action): void
    {
        $currentRoles = $this->getRoleNames()->sort()->values()->all();

        if ($previousRoles === $currentRoles) {
            return;
        }

        $activity = activity('user-roles')
            ->performedOn($this)
            ->withProperties([
                'old' => ['roles' => $previousRoles],
                'attributes' => ['roles' => $currentRoles],
                'action' => $action,
            ])
            ->event('updated');

        if (auth()->check()) {
            $activity->causedBy(auth()->user());
        }

        $activity->log('Cambio de rol de usuario');
    }
}
