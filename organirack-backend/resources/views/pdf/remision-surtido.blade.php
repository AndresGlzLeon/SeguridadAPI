<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Vale de Salida - {{ $orden->folio ?? 'N/A' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #222;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
        }
        
        /* ENCABEZADO */
        .header {
            background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
            border-left: 4px solid #2563eb;
            border-bottom: 2px solid #ddd;
            padding: 8px 10px;
            margin-bottom: 10px;
        }
        
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .titulo {
            font-size: 18px;
            font-weight: 700;
            color: #222;
            letter-spacing: -0.3px;
        }
        
        .folio-badge {
            background: #2563eb;
            color: white;
            padding: 5px 14px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 13px;
            font-family: 'Courier New', monospace;
        }
        
        .subtitulo {
            font-size: 11px;
            color: #666;
            margin-bottom: 3px;
        }
        
        /* INFO GRID - 4 columnas compacto */
        .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        .info-item {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 3px;
            padding: 5px 6px;
        }
        
        .info-label {
            font-size: 9px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
        }
        
        .info-value {
            font-size: 12px;
            font-weight: 600;
            color: #222;
            word-break: break-word;
        }
        
        .info-value.mono {
            font-family: 'Courier New', monospace;
        }
        
        /* PERSONAL */
        .personnel-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            background: #f0f6ff;
            padding: 6px;
            border-radius: 3px;
            border: 1px solid #bfdbfe;
            margin-bottom: 10px;
        }
        
        .personnel-item {
            display: flex;
            gap: 6px;
            align-items: flex-start;
        }
        
        .personnel-icon {
            width: 24px;
            height: 24px;
            background: #2563eb;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            flex-shrink: 0;
        }
        
        .personnel-info {
            flex: 1;
        }
        
        .personnel-role {
            font-size: 10px;
            font-weight: 600;
            color: #1e40af;
            text-transform: uppercase;
        }
        
        .personnel-name {
            font-size: 13px;
            font-weight: 600;
            color: #222;
            margin-top: 1px;
        }
        
        /* TABLA */
        .tabla-titulo {
            font-size: 12px;
            font-weight: 700;
            color: #fff;
            background: #222;
            padding: 6px 8px;
            margin-top: 10px;
            margin-bottom: 0;
            border-radius: 3px 3px 0 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            margin-bottom: 15px;
            border: 1px solid #d1d5db;
            border-top: none;
        }
        
        th {
            background: #f3f4f6;
            color: #1f2937;
            padding: 8px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-bottom: 2px solid #d1d5db;
            border-right: 1px solid #e5e7eb;
        }
        
        th:last-child {
            border-right: none;
        }
        
        td {
            padding: 7px 8px;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
        }
        
        td:last-child {
            border-right: none;
        }
        
        tbody tr:nth-child(even) {
            background: #f9fafb;
        }
        
        tbody tr:hover {
            background: #f3f4f6;
        }
        
        .sku {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #1e40af;
            font-size: 12px;
        }
        
        .producto-nombre {
            font-weight: 500;
            color: #222;
        }
        
        .ubicacion-badge {
            background: #fef3c7;
            color: #92400e;
            padding: 2px 6px;
            border-radius: 2px;
            font-weight: 600;
            font-size: 12px;
            font-family: 'Courier New', monospace;
        }
        
        .cantidad {
            text-align: right;
            font-weight: 600;
            color: #222;
        }
        
        /* FIRMAS */
        .firma-title {
            font-size: 12px;
            font-weight: 700;
            color: #222;
            margin-top: 12px;
            margin-bottom: 8px;
        }
        
        .firma-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .firma-item {
            text-align: center;
        }
        
        .firma-linea {
            border-top: 2px solid #222;
            height: 40px;
            margin-bottom: 4px;
        }
        
        .firma-label {
            font-size: 12px;
            font-weight: 700;
            color: #222;
        }
        
        .firma-subtexto {
            font-size: 9px;
            color: #666;
            margin-top: 1px;
        }
        
        /* PIE DE PÁGINA */
        .footer {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
            line-height: 1.3;
        }
        
        .centered {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- ENCABEZADO COMPACTO -->
        <div class="header">
            <div class="header-top">
                <div>
                    <div class="titulo">VALE DE SALIDA / REMISIÓN</div>
                    <div class="subtitulo">OrganiRack+ | Sistema de Gestión de Inventario</div>
                </div>
                <div class="folio-badge">{{ $orden->folio ?? '---' }}</div>
            </div>
        </div>

        <!-- INFORMACIÓN EN 2 COLUMNAS -->
        <div class="info-section">
            <div class="info-item">
                <div class="info-label">Referencia/Destino</div>
                <div class="info-value">{{ $orden->referencia_destino ?? '---' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Estado</div>
                <div class="info-value">{{ $orden->estado->nombre ?? '---' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Fecha Requerida</div>
                <div class="info-value">
                    @if($orden->fecha_requerida)
                        {{ \Carbon\Carbon::parse($orden->fecha_requerida)->format('d/m/Y H:i') }}
                    @else
                        ---
                    @endif
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Fecha Impresión</div>
                <div class="info-value">{{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Prioridad</div>
                <div class="info-value">{{ $orden->prioridad->nombre ?? '---' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Cantidad Detalles</div>
                <div class="info-value">{{ $orden->detalles ? count($orden->detalles) : 0 }} productos</div>
            </div>
        </div>

        <!-- PERSONAL INVOLUCRADO -->
        <div class="personnel-row">
            @if($orden->capturista)
                <div class="personnel-item">
                    <div class="personnel-info">
                        <div class="personnel-role">Capturista</div>
                        <div class="personnel-name">{{ $orden->capturista->name }}</div>
                    </div>
                </div>
            @else
                <div class="personnel-item">
                    <div class="personnel-info">
                        <div class="personnel-role">Capturista</div>
                        <div class="personnel-name">Sin asignar</div>
                    </div>
                </div>
            @endif

            @if($orden->almacenista)
                <div class="personnel-item">
                    <div class="personnel-info">
                        <div class="personnel-role">Almacenista</div>
                        <div class="personnel-name">{{ $orden->almacenista->name }}</div>
                    </div>
                </div>
            @else
                <div class="personnel-item">
                    <div class="personnel-info">
                        <div class="personnel-role">Almacenista</div>
                        <div class="personnel-name">Sin asignar</div>
                    </div>
                </div>
            @endif
        </div>

        <!-- TABLA DE DETALLES -->
        <div class="tabla-titulo">📋 Detalles de Productos a Surtir</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 11%;">SKU</th>
                    <th style="width: 36%;">Descripción</th>
                    <th style="width: 11%; text-align: center;">Cantidad</th>
                    <th style="width: 20%;">Ubicación</th>
                    <th style="width: 11%; text-align: center;">Surtida</th>
                </tr>
            </thead>
            <tbody>
                @if($orden->detalles && count($orden->detalles) > 0)
                    @foreach($orden->detalles as $detalle)
                        <tr>
                            <td><span class="sku">{{ $detalle->producto->sku ?? '---' }}</span></td>
                            <td><span class="producto-nombre">{{ $detalle->producto->nombre ?? '---' }}</span></td>
                            <td class="cantidad">{{ number_format($detalle->cantidad_requerida, 2, '.', ',') }}</td>
                            <td class="centered">
                                @if($detalle->estanteReal)
                                    <span class="ubicacion-badge">{{ $detalle->estanteReal->codigo_etiqueta }}</span>
                                @else
                                    <span style="color: #999; font-size: 11px;">-</span>
                                @endif
                            </td>
                            <td class="cantidad">{{ number_format($detalle->cantidad_surtida ?? 0, 2, '.', ',') }}</td>
                        </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="5" class="centered" style="padding: 15px;">Sin detalles de productos registrados</td>
                    </tr>
                @endif
            </tbody>
        </table>

        <!-- FIRMAS MEJORADAS -->
        <div class="firma-title">✍️ Firmas de Autorización</div>
        <div class="firma-grid">
            <div class="firma-item">
                <div class="firma-linea"></div>
                <div class="firma-label">Firma del Almacenista</div>
                <div class="firma-subtexto">(Quien Entrega / Surte)</div>
            </div>
            <div class="firma-item">
                <div class="firma-linea"></div>
                <div class="firma-label">Firma del Recibidor</div>
                <div class="firma-subtexto">(Quien Recibe / Verifica)</div>
            </div>
        </div>

        <!-- PIE DE PÁGINA -->
        <div class="footer">
            <strong>📌 Documento Oficial Generado por OrganiRack+</strong><br>
            Este vale de salida es un documento de control de inventario. La información debe coincidir con el surtido físico realizado.<br>
            Sistema de Gestión de Inventario - Validación Dinámica en Tiempo Real
        </div>
    </div>
</body>
</html>
