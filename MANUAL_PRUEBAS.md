# Manual de Pruebas - Sistema POS

## Descripción General
Este manual te guiará paso a paso para probar todas las funcionalidades del Sistema POS, incluyendo ventas, devoluciones, gestión de usuarios y productos.

## Usuarios de Prueba

### Empleados
- **Código:** 1001 - **Nombre:** Juan Pérez
- **Código:** 2001 - **Nombre:** María García

### Administrador
- **Código:** 9999 - **Nombre:** Carlos Admin

## 1. Pruebas de Autenticación

### 1.1 Inicio de Sesión
1. Abre la aplicación
2. Ingresa uno de los códigos de empleado (1001, 2001, 9999)
3. Presiona "Iniciar Sesión"
4. Verifica que aparezca el terminal POS

### 1.2 Cambio de Usuario
1. Con un usuario logueado, agrega algunos productos al carrito
2. Cierra sesión
3. Inicia sesión con otro usuario
4. **Verificar:** El carrito debe estar vacío (cada usuario tiene su propio carrito)

## 2. Pruebas de Ventas

### 2.1 Agregar Productos
1. En la búsqueda, escribe "Inca" para buscar Inca Kola
2. Selecciona el producto y agrégalo al carrito
3. Cambia la cantidad usando los botones + y -
4. Agrega más productos de diferentes categorías

### 2.2 Búsqueda por Código de Barras
1. En el campo de búsqueda, ingresa: `7501234567890`
2. Presiona Enter
3. **Verificar:** Debe agregar automáticamente Inca Kola al carrito

### 2.3 Simulación de Escaneo
1. Haz clic en el botón de escaneo (icono de código de barras)
2. **Verificar:** Debe agregar un producto aleatorio al carrito

### 2.4 Filtros por Categoría
1. Haz clic en las categorías (Bebidas, Lácteos, etc.)
2. **Verificar:** Solo se muestran productos de esa categoría

## 3. Pruebas de Pago

### 3.1 Pago en Efectivo
1. Agrega productos al carrito (total aproximado: S/. 15.50)
2. Haz clic en "Procesar Pago"
3. Selecciona "Efectivo"
4. **Verificar:** El total se redondea (ej: S/. 15.50 → S/. 15.50)
5. Ingresa S/. 20.00 como monto recibido
6. **Verificar:** Muestra el cambio correcto
7. Confirma el pago
8. **Verificar:** Se muestra el ticket de venta

### 3.2 Pago con Tarjeta
1. Agrega productos al carrito
2. Haz clic en "Procesar Pago"
3. Selecciona "Tarjeta"
4. **Verificar:** El total mantiene los decimales exactos
5. Confirma el pago
6. **Verificar:** Simula procesamiento de tarjeta (2 segundos)

## 4. Pruebas de Ofertas

### 4.1 Oferta 3x2 (Inca Kola)
1. Agrega 3 Inca Kola al carrito
2. **Verificar:** Se aplica descuento automáticamente (pagas 2, llevas 3)
3. Agrega 6 Inca Kola
4. **Verificar:** Se aplican 2 ofertas (pagas 4, llevas 6)

### 4.2 Oferta 2+1 (Pan + Leche)
1. Agrega 2 Pan Francés al carrito
2. Agrega 1 Leche Gloria
3. **Verificar:** La leche aparece gratis (descuento del 100%)

## 5. Pruebas de Devoluciones

### 5.1 Realizar una Venta para Devolver
1. Inicia sesión como empleado (1001)
2. Vende varios productos y completa la venta
3. **Anota el número de ticket** (ej: T1234567890)

### 5.2 Devolución Parcial
1. Haz clic en "Devoluciones"
2. Ingresa el número de ticket anotado
3. Haz clic en "Buscar"
4. **Verificar:** Aparecen los productos de la venta
5. Selecciona solo algunos productos para devolver
6. Ingresa un motivo: "Cliente cambió de opinión"
7. Procesa la devolución
8. **Verificar:** 
   - Se restaura el stock
   - El estado de la venta cambia a "Devolución Parcial"
   - Se muestra el monto devuelto

### 5.3 Devolución Completa
1. Busca el mismo ticket nuevamente
2. Devuelve los productos restantes
3. **Verificar:** El estado cambia a "Devuelto"

### 5.4 Estados de Venta
- **Completado:** Venta normal sin devoluciones
- **Devolución Parcial:** Algunos productos fueron devueltos
- **Devuelto:** Todos los productos fueron devueltos

## 6. Pruebas de Administración (Solo Admin - Código 9999)

### 6.1 Gestión de Productos
1. Inicia sesión como admin (9999)
2. Haz clic en "Administración"
3. Ve a la pestaña "Productos"
4. Crea un nuevo producto
5. Edita un producto existente
6. Cambia el precio de un producto
7. **Verificar:** Los cambios se reflejan en el sistema

### 6.2 Gestión de Ofertas
1. Ve a la pestaña "Ofertas"
2. Crea una nueva oferta 2x1
3. **Verificar:** La oferta se aplica automáticamente en ventas

### 6.3 Gestión de Usuarios
1. Ve a la pestaña "Usuarios"
2. Crea un nuevo empleado
3. Desactiva un usuario
4. **Verificar:** El usuario desactivado no puede iniciar sesión

## 7. Pruebas de Stock

### 7.1 Stock Bajo
1. Como admin, edita un producto y ponle stock = 5
2. **Verificar:** Aparece en la lista de "Stock Bajo"
3. Vende 3 unidades de ese producto
4. **Verificar:** El stock se actualiza automáticamente

### 7.2 Sin Stock
1. Vende todas las unidades de un producto
2. Intenta agregar más al carrito
3. **Verificar:** Muestra mensaje "Producto sin stock disponible"

## 8. Pruebas de Sesión

### 8.1 Múltiples Terminales
1. Inicia sesión con un usuario en una pestaña
2. Intenta iniciar sesión con el mismo usuario en otra pestaña
3. **Verificar:** Muestra mensaje "El empleado ya está activo en otro terminal"

### 8.2 Timeout de Sesión
1. Deja la aplicación inactiva por 20 minutos
2. **Verificar:** La sesión se cierra automáticamente

## 9. Casos de Error a Probar

### 9.1 Ticket No Encontrado
1. En devoluciones, busca un ticket inexistente: "T999999999"
2. **Verificar:** Muestra "Ticket no encontrado"

### 9.2 Ticket Ya Devuelto
1. Intenta devolver un ticket que ya fue completamente devuelto
2. **Verificar:** Muestra "Este ticket ya fue devuelto completamente"

### 9.3 Código de Empleado Inválido
1. Intenta iniciar sesión con código "0000"
2. **Verificar:** Muestra "Código de empleado inválido o inactivo"

## 10. Verificaciones Finales

### 10.1 Persistencia de Datos
1. Realiza varias operaciones (ventas, devoluciones, etc.)
2. Recarga la página
3. **Verificar:** Todos los datos se mantienen

### 10.2 Cálculos Correctos
1. Verifica que los totales incluyan:
   - Subtotal
   - Descuentos por ofertas
   - IGV (18%)
   - Total final

### 10.3 Redondeo en Efectivo
1. Crea una venta con total S/. 15.47
2. **Verificar:** En efectivo se redondea a S/. 15.45
3. Crea una venta con total S/. 15.48
4. **Verificar:** En efectivo se redondea a S/. 15.50

## Notas Importantes

- **Carrito por Usuario:** Cada usuario mantiene su propio carrito independiente
- **Stock en Tiempo Real:** El stock se actualiza inmediatamente después de cada venta
- **Ofertas Automáticas:** Las ofertas se aplican automáticamente al agregar productos
- **Redondeo Inteligente:** Solo en efectivo, se redondea a múltiplos de 5 céntimos
- **Devoluciones Parciales:** Se pueden hacer múltiples devoluciones del mismo ticket
- **Restauración de Stock:** El stock se restaura automáticamente en devoluciones

## Problemas Conocidos Solucionados

✅ **Carrito compartido entre usuarios:** Ahora cada usuario tiene su carrito independiente
✅ **Error en proceso de pago:** Corregido el error de DOM
✅ **Iconos Lucide React:** Reemplazados por SVG nativos
✅ **Redondeo en efectivo:** Implementado redondeo a 5 céntimos
✅ **Proceso de devoluciones:** Mejorado con validaciones y estados correctos