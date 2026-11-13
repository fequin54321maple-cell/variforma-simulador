# Variforma Simulador

Aplicación web instalable (PWA) para simular trayectorias NC del dialecto Variforma (hilado / flow-forming, estilo Fanuc torno).

## Uso

Abre la aplicación publicada en GitHub Pages:

**https://fequin54321maple-cell.github.io/variforma-simulador/**

- En Chrome o Edge para Android: menú del navegador → **Instalar aplicación**, o el botón Instalar de la propia app.
- En iPhone / iPad (Safari): botón Compartir → **Añadir a pantalla de inicio**.
- En el ordenador: Instalar desde la barra de direcciones o el botón de la app.

En el teléfono, el engranaje (⚙) o la pestaña Datos permiten elegir **Tamaño: Auto / Chico / Normal / Grande** y **Modo: Auto / Vertical / Horizontal**. Las barras inferiores permanecen visibles en retrato y apaisado.

En la pestaña **Código** la gráfica permanece visible para editar y ver la trayectoria en tiempo real: en retrato queda arriba (~45 %) con el editor abajo y un divisor arrastrable; en apaisado van lado a lado. Al escribir se redibuja la trayectoria (se conserva el zoom). La gráfica resalta la línea del cursor y, si **Seguir cursor** está activo, acerca el tramo si queda fuera de la vista. Los tramos cambiados se destacan frente a un fantasma tenue de la trayectoria original. Con el teclado de iOS abierto la gráfica se encoge pero no desaparece.

Puedes abrir tus propios archivos `.NCD` / `.nc` desde la biblioteca, el selector de archivos o, en Android, compartiendo el archivo hacia la app. Incluye un ejemplo de demostración generado (Copa O9000). No se publican programas reales de máquina.

**Dos cabezas:** https://fequin54321maple-cell.github.io/variforma-simulador/dos_cabezas.html (botón **2 cabezas** en el simulador). **Abrir 1 o 2** acepta elegir los dos archivos a la vez: la app reconoce por el contenido el R5/T0005 (→ Cabeza 1) y la pistola de diecoat (M9, `M98 P1000` → Cabeza 2), luego por el nombre o el orden; avisa qué archivo fue a cada cabeza (con ⚠ si un archivo trae R5 y pintura a la vez) y **⇄ Intercambiar** los cambia; también hay **Abrir Cabeza 1** y **Abrir Cabeza 2**, o un archivo con marcas `(HEAD1)` / `(HEAD2)`. Un selector grande **Cabeza 1 / Cabeza 2** arriba del editor cambia de programa (cada uno guarda su cursor, desplazamiento y deshacer); en escritorio u horizontal, **◫ Ver ambas** los muestra lado a lado. Las dos cabezas se dibujan en una gráfica vertical (Cabeza 2 —pistola de diecoat y R12— a la izquierda, Cabeza 1 —R12 y R5— a la derecha; se puede invertir) y se animan juntas; el spray (M9 … M10) se ve en su propio color. Esperas en **auto**: los códigos M100–M199 que están en las dos cabezas (o una lista fija en ⚙); la que llega primero se detiene hasta que la otra llega al mismo código. Los subprogramas externos (`M98 P…` que no están en el archivo) cuentan 0 s salvo que se les dé un tiempo en ⚙. El editor muestra qué hace cada código (M17/M18 tailstock, M36 contador de rines, M34/M35 quemador, M9/M10 spray, M02 gira mandril, M98 subprograma, M100–M199 espera entre cabezas; M23/M24/M73 sin confirmar) y las pausas **G04** (`G04 X1.` = 1 s) se cuentan en el tiempo y se ven con cuenta regresiva. Incluye un EJEMPLO de demostración (no apto para máquina): Cabeza 2 pinta hacia arriba el mandril vacío, va a casa, espera la carga del robot, pinta el rin y libera a Cabeza 1; Cabeza 1 hace las pasadas R12 1–3 y el R5; Cabeza 2 entra desde arriba al final con las pasadas 4–5. Las líneas con «/» se ejecutan por defecto (Omitir block delete apagado).

La app funciona sin red después de la primera visita (service worker con caché). Si sale una versión nueva, aparece un aviso para actualizar.

Esta página debe servirse por HTTPS (GitHub Pages lo cumple).
