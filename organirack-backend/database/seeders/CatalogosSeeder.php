<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Marca;
use App\Models\UnidadMedida;
use App\Models\EstadoInventario;
use Illuminate\Database\Seeder;

class CatalogosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Crea catálogos base realistas:
     * - 10 Categorías de productos
     * - 15 Marcas comerciales
     * - 8 Unidades de medida
     * - 4 Estados de inventario (CRÍTICO para el picking)
     */
    public function run(): void
    {
        // ============ CATEGORÍAS ============
        $categorias = [
            ['nombre' => 'Electrónica', 'descripcion' => 'Componentes electrónicos y semiconductores'],
            ['nombre' => 'Herramientas Manuales', 'descripcion' => 'Herramientas de mano (destornilladores, martillos, etc.)'],
            ['nombre' => 'Ferretería', 'descripcion' => 'Tuercas, tornillos, pernos, arandelas'],
            ['nombre' => 'Materiales de Construcción', 'descripcion' => 'Materiales para construcción y obra'],
            ['nombre' => 'Eléctrica', 'descripcion' => 'Cables, interruptores, conectores eléctricos'],
            ['nombre' => 'Plomería', 'descripcion' => 'Tuberías, válvulas, accesorios PVC'],
            ['nombre' => 'Acabados y Pintura', 'descripcion' => 'Pintura, barniz, masilla, adhesivos'],
            ['nombre' => 'Sellantes y Adhesivos', 'descripcion' => 'Pegamentos, selladoras, silicones'],
            ['nombre' => 'Consumibles', 'descripcion' => 'Artículos de consumo rápido'],
            ['nombre' => 'Hardware Industrial', 'descripcion' => 'Componentes industriales de precisión'],
        ];

        foreach ($categorias as $categoria) {
            Categoria::create($categoria);
        }

        // ============ MARCAS ============
        $marcas = [
            ['nombre' => 'Truper', 'sitio_web' => 'www.truper.com.mx'],
            ['nombre' => 'DeWalt', 'sitio_web' => 'www.dewalt.com'],
            ['nombre' => 'Samsung', 'sitio_web' => 'www.samsung.com'],
            ['nombre' => 'Bosch', 'sitio_web' => 'www.bosch.com'],
            ['nombre' => '3M', 'sitio_web' => 'www.3m.com'],
            ['nombre' => 'Hilti', 'sitio_web' => 'www.hilti.com'],
            ['nombre' => 'Stanley', 'sitio_web' => 'www.stanley.com'],
            ['nombre' => 'Makita', 'sitio_web' => 'www.makita.com'],
            ['nombre' => 'Rotoplas', 'sitio_web' => 'www.rotoplas.com.mx'],
            ['nombre' => 'Sipsa', 'sitio_web' => 'www.sipsa.com.mx'],
            ['nombre' => 'Lumisol', 'sitio_web' => 'www.lumisol.com'],
            ['nombre' => 'KMC Cables', 'sitio_web' => 'www.kmccables.com'],
            ['nombre' => 'Condumex', 'sitio_web' => 'www.condumex.com'],
            ['nombre' => 'Forjal', 'sitio_web' => 'www.forjal.com.mx'],
            ['nombre' => 'Sika', 'sitio_web' => 'www.sika.com.mx'],
        ];

        foreach ($marcas as $marca) {
            Marca::create($marca);
        }

        // ============ UNIDADES DE MEDIDA ============
        $unidades = [
            ['nombre' => 'Piezas', 'abreviatura' => 'Pzas'],
            ['nombre' => 'Cajas', 'abreviatura' => 'Caj'],
            ['nombre' => 'Metros', 'abreviatura' => 'm'],
            ['nombre' => 'Kilogramos', 'abreviatura' => 'kg'],
            ['nombre' => 'Litros', 'abreviatura' => 'L'],
            ['nombre' => 'Rollos', 'abreviatura' => 'Rol'],
            ['nombre' => 'Bolsas', 'abreviatura' => 'Bol'],
            ['nombre' => 'Galones', 'abreviatura' => 'Gal'],
        ];

        foreach ($unidades as $unidad) {
            UnidadMedida::create($unidad);
        }

        // ============ ESTADOS DE INVENTARIO (¡CRÍTICO PARA PICKING!) ============
        /**
         * REGLA DE NEGOCIO:
         * La tabla `inventarios` tiene la estructura (producto_id, estante_id, estado_id, cantidad).
         * Esto permite tener el MISMO producto en el MISMO estante con DIFERENTES estados.
         * Ej: 100 unidades "Disponible" + 10 "Dañado" = mismo producto, mismo estante, diferente row
         */
        $estados = [
            [
                'nombre' => 'Disponible',
                'descripcion' => 'Stock listo para picking',
            ],
            [
                'nombre' => 'Dañado',
                'descripcion' => 'Producto defectuoso o dañado, no disponible para venta',
            ],
            [
                'nombre' => 'En Cuarentena',
                'descripcion' => 'Bajo revisión, no disponible hasta confirmación',
            ],
            [
                'nombre' => 'Merma',
                'descripcion' => 'Pérdida o depreciación comercial',
            ],
        ];

        foreach ($estados as $estado) {
            EstadoInventario::create($estado);
        }
    }
}
