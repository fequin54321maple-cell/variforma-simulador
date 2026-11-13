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

**Dos cabezas:** https://fequin54321maple-cell.github.io/variforma-simulador/dos_cabezas.html (botón **2 cabezas** en el simulador). Abre HEAD1 y HEAD2 como dos archivos o uno con marcas `(HEAD1)` / `(HEAD2)`; cada cabeza tiene su editor, ambas se dibujan en una gráfica vertical (Cabeza 1 a la derecha, Cabeza 2 a la izquierda; se puede invertir) y se animan juntas. Los movimientos de la pistola de diecoat (entre M9 y M10) se ven en su propio color («Spray M9»). Las cabezas se esperan en los códigos M configurados (por defecto M100–M199, en ⚙): la que llega primero se detiene hasta que la otra llega al mismo código. Incluye un EJEMPLO de demostración (no apto para máquina): Cabeza 1 pinta (/M9 … /M10) y luego libera a Cabeza 2 con M107 (código supuesto); al final cada cabeza se va a casa y termina sola. Las líneas con «/» se ejecutan por defecto (Omitir block delete apagado).

La app funciona sin red después de la primera visita (service worker con caché). Si sale una versión nueva, aparece un aviso para actualizar.

Esta página debe servirse por HTTPS (GitHub Pages lo cumple).
