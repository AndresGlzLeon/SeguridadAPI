# Exportar Códigos de Estantes para QR

## 🚀 Forma MÁS SIMPLE (3 segundos)

### Opción 1: Script PHP Directo

```bash
cd organirack-backend

# Exportar a CSV (recomendado)
php export_estantes.php csv

# O a JSON
php export_estantes.php json

# O solo texto (un código por línea)
php export_estantes.php txt
```

**El archivo se genera automáticamente en:**
```
storage/app/exports/estantes_codigos_YYYYMMDD_HHMMSS.csv
```

---

## 📋 Ejemplos de Salida

### CSV (Para Excel o Google Sheets)
```
ID,CODIGO_ETIQUETA,TIPO_ZONA,ESTADO
1,A-01-11,PREMIUM,Libre
2,A-01-12,STANDARD,Libre
3,A-01-21,ZONE_ACCESO_RAPIDO,Lleno
...
```

### TXT (Solo códigos)
```
CÓDIGOS DE ESTANTES PARA QR
==================================================
Generado: 2026-04-01 14:30:00
Total: 657 estantes
==================================================

A-01-11
A-01-12
A-01-21
A-02-11
...
```

---

## 🔄 Paso a Paso: Generar QR

### MÉTODO 1: En Línea (MÁS FÁCIL) ✨

**1. Exporta los códigos:**
```bash
php export_estantes.php txt
```

**2. Abre en Excel/Sheets el archivo CSV:**
- Ve a `storage/app/exports/estantes_codigos_*.csv`
- Selecciona la columna `CODIGO_ETIQUETA`
- Copia todos los códigos

**3. Usa un generador QR en línea:**

#### Opción A: Generador Masivo
- https://www.qr-code-generator.com/
- Selecciona "Batch QR Code Generator"
- Pega todos los códigos (uno por línea)
- Haz clic en "Generate"
- Descarga todos los QR en ZIP

#### Opción B: Google Sheets (Fórmula Mágica)
```
1. Importa el CSV en Google Sheets
2. En columna B, crea fórmula:
   =IMAGE("https://chart.googleapis.com/chart?chs=200x200&chld=L|0&cht=qr&chl="&ENCODEURL(A1))
3. Copia la fórmula hacia abajo
4. ¡Ves todos los QR automáticamente!
5. Descarga como PDF e imprime
```

---

### MÉTODO 2: Usando Artisan (También Fácil)

```bash
# Ejecutar comando personalizado
php artisan export:codigos-estantes --formato=csv

# Ubicación: storage/app/exports/estantes_codigos_*.csv
```

---

## 💾 Importar en Excel/Sheets para Generar Masivamente

### Pasos:

1. **Exporta CSV:**
   ```bash
   php export_estantes.php csv
   ```

2. **Abre en Excel:**
   - Abre `estantes_codigos_*.csv`
   - Se importa automáticamente

3. **Opción Excel: Usa Editor de Macros o Plugin**
   - Descarga: [QR Code by Zint](https://sourceforge.net/projects/zint/)
   - O usa plugin de Excel: [QR Code Add-in](https://www.excel-qa.com/qr-codes-in-excel/)

4. **Opción Google Sheets: Fórmula Imagen + QR**
   ```
   Columna A: Códigos (importados del CSV)
   Columna B: =IMAGE("https://chart.googleapis.com/chart?chs=200x200&chld=L|0&cht=qr&chl="&ENCODEURL(A1))
   ```

---

## 🐍 Script Python para Generar QR (Nivel Avanzado)

Si tienes Python instalado, usa este script más potente:

**generar_qr.py:**
```python
import csv
import qrcode
import os
from pathlib import Path

# Leer CSV exportado
input_csv = "storage/app/exports/estantes_codigos_*.csv"
output_dir = "public/qr_codes"

# Crear directorio
Path(output_dir).mkdir(parents=True, exist_ok=True)

# Generar QR para cada código
with open(input_csv, 'r') as file:
    reader = csv.DictReader(file)
    for row in reader:
        codigo = row['CODIGO_ETIQUETA']
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(codigo)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(f"{output_dir}/{codigo}.png")
        print(f"✅ QR generado: {codigo}.png")

print(f"\n✅ QR generados en: {output_dir}")
```

**Usar:**
```bash
pip install qrcode pillow
python generar_qr.py
```

---

## 📊 Resumen de Métodos

| Método | Dificultad | Tiempo | Resultado |
|--------|-----------|--------|-----------|
| **Exportar CSV + Google Sheets** | ⭐ | 2 min | QR en imagen/PDF |
| **QR Code Generator.com** | ⭐ | 3 min | ZIP con todos los QR |
| **Excel Plugin** | ⭐⭐ | 5 min | Directamente en Excel |
| **Script Python** | ⭐⭐⭐ | 10 min | PNG para cada código |
| **Comando Artisan** | ⭐⭐ | 1 min | CSV exportado |

---

## 🖨️ Recomendación Final

### Para Imprimir Etiquetas:

**MEJOR OPCIÓN:**
1. ```bash
   php export_estantes.php csv
   ```
2. Abre el CSV en Google Sheets
3. Agrega la fórmula de QR en columna B
4. Exporta como PDF
5. Imprime directamente

**ALTERNATIVA RÁPIDA:**
1. Exporta a CSV
2. Usa https://www.qr-code-generator.com/
3. Sube el archivo CSV
4. Descarga todos los QR en ZIP
5. Organiza en documento e imprime

---

## 🔗 Útiles

- **Google Charts (QR gratis)**: `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=CODIGO_AQUI`
- **Generador: https://www.qr-code-generator.com/de/
- **Alternativa: https://qr.irovak.com/
- **Editor para imprimir: https://www.canva.com/ (importa imagen + diseña etiqueta)

---

## ✅ Comandos Rápidos

```bash
# Opción 1: Más simple (recomendado)
cd organirack-backend
php export_estantes.php csv

# Opción 2: Usando Artisan
php artisan export:codigos-estantes --formato=csv

# Ver dónde quedó el archivo
dir storage\app\exports\
```

---

*Generado: OrganiRack Plus | Abril 2026*
