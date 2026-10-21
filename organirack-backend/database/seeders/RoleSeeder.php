<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Roles definidos por la problemática 
        Role::create(['name' => 'Jefe de Almacen']);
        Role::create(['name' => 'Almacenista']);
        Role::create(['name' => 'Gerencia de Operaciones']);
        Role::create(['name' => 'Capturista']);
    }
}
