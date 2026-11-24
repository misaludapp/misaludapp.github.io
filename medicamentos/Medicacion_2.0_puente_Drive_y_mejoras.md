# Medicación 2.0 · Puente de Drive, PWA, correcciones y avisos

Resultado de aplicar el MD «Seguridad solo para el puente» a `medicacion.html` (versión 1), corregir lo que estaba mal e implementar las mejoras acordadas: **avisos en el calendario**, **hoja semanal imprimible** y **«Tomé todas»**. Al final, lo que queda apuntado.

**Archivos a subir (carpeta nueva, p. ej. `/medicacion/`):** `index.html`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png`.

---

## 0. Antes de nada (2 minutos)

1. En la versión 1: **Ajustes → Mostrar copia → Copiar**, y pega el texto en una nota o en un archivo `medicacion_v1.json`. Es tu red de seguridad.
2. **Los datos van con la dirección web, no con el archivo.** Si la versión 1 la abrías desde `…github.io/…/medicacion.html`, sube la 2.0 **al mismo sitio** y la primera vez pasará tus datos sola. Si la abrías como archivo del móvil o desde otra dirección, la 2.0 saldrá vacía: no se ha perdido nada. Ve a Ajustes → tarjeta de Drive → «Restaurar desde un archivo» y elige el `.json` del paso 1.

---

## 1. Dónde estaban tus datos: **no** en IndexedDB

La versión 1 guardaba todo en **localStorage** (`med1`) y además una copia en **`window.name`**.

- **`window.name` era un fallo de privacidad**: esa copia sobrevive al navegar, y **cualquier web que se abriera después en la misma pestaña podía leer la lista completa de medicación**.
- Si localStorage se leía mal una sola vez, la app arrancaba vacía y **guardaba encima al instante**, borrando todo.

La 2.0 guarda **solo en IndexedDB** (base `medicacion`):

1. La primera vez copia tus datos (de localStorage, o de `window.name` si no había otra cosa), los vuelve a leer y los compara.
2. Si algo no cuadra, **no usa la copia**: avisa y la app queda en **solo lectura**.
3. Si los datos antiguos estuvieran dañados, avisa, no toca nada y te deja descargarlos tal cual.
4. Borra la copia de `window.name` en cuanto los datos están a salvo.
5. El original de localStorage se conserva hasta tu **primera copia de seguridad hecha con la 2.0**, y entonces se borra **solo esa clave**.

---

## 2. Parámetros usados (fila nueva de la tabla de «usados»)

| App | Prefijo SPX | Claves propias | Carpeta Drive | Cabecera MG | Caché SW |
|---|---|---|---|---|---|
| Medicación 2.0 | `mc` | `mc_pte` (localStorage, cifrado), `mc_pte_db` (IndexedDB, clave del dispositivo), IndexedDB `medicacion` (antes localStorage `med1` y `window.name`) | `Mi unidad/Apps/Backups/medicamentos` | `MCENC1\n` | `medicacion-` |

No coinciden con ninguno de los ya usados (gd, ms, gj, qp, ca, me, gv, th, mu, dv, lr, bt, cs, cd, nl, hs). Bloque SP literal, cambiando solo `SPX`, `DAPP` y `MG`. Parámetros criptográficos sin tocar.

---

## 3. Contraseñas: ninguna en texto claro

- La dirección del puente, la clave del puente y la contraseña de copias se guardan **juntas y cifradas** (AES-GCM) en `localStorage['mc_pte']`. La llave es una **clave del dispositivo no extraíble** en `mc_pte_db`.
- **Ninguna viaja por la red.** En Drive solo hay copias `.gdc` **cifradas**: no se lee ni un nombre de medicamento.

**Comprobado**: he buscado la dirección, la clave y la contraseña en localStorage, en `window.name` y en todas las bases IndexedDB, y **no aparecen**. Dentro de la copia cifrada tampoco hay texto legible.

---

## 4. PWA y desinstalación

- La app **nunca** vacía localStorage entero ni borra bases de otras apps. El `sw.js` solo borra cachés `medicacion-` y solo atiende archivos de su carpeta.
- **Android**: al desinstalar se quita el icono y **los datos se quedan**.
- **Ordenador**: **no marques «Borrar también los datos de Chrome»** (borraría todo el dominio, es decir, todas tus apps).
- **iPhone**: cada app de la pantalla de inicio tiene su propio almacenamiento; al borrarla se borra **solo lo suyo**.

---

## 5. Correcciones

| Error de la 1.0 | Ahora |
|---|---|
| Copia de los datos en `window.name`, legible por otras webs | Eliminada |
| Datos dañados → la app arrancaba vacía y guardaba encima | Avisa, no toca nada y deja descargarlos |
| **El historial dependía de la pauta actual**: si editabas un medicamento o cambiabas sus tomas, los días pasados se descolocaban; si lo borrabas, desaparecía del informe | **Versiones de la pauta**: al cambiar algo, la pauta anterior se guarda hasta ayer y los días pasados no cambian. Además, cada toma registrada guarda qué se tomó (nombre, dosis y hora prevista) |
| Borrar un medicamento borraba su historial del informe | Ahora es **«Retirar»**: deja de salir desde hoy, pero sigue en el historial y en el informe. En «Retirados» puedes volver a tomarlo o eliminarlo del todo |
| Pausar contaba hacia atrás (los días pasados también parecían «en pausa») | La pausa empieza el día que la pones |
| Restaurar pegando texto, sin copia previa ni comprobación | Restaurar comprueba la copia entera (formato de fechas, horas, reglas e identificadores), descarga antes una copia previa (cifrada si tienes Drive) y luego sustituye. Acepta `.gdc` y el texto de la versión 1 guardado como `.json` |
| Una copia manipulada podía meter código | Todo se escapa y la validación lo rechaza (probado) |
| Borrar el registro de tomas, sin copia | Descarga antes una copia |

---

## 6. Mejoras implementadas

### 📅 Avisos en el calendario (Medicación → «Avisos en el calendario»)

La app genera un archivo de calendario con **cada toma de los próximos 90 días** (30/60/90/180, en Ajustes), ya calculada con tus reglas, ciclos y descansos, y con **su alarma** (a la hora o 5/10/15 minutos antes).

- Las pastillas de la misma hora van **juntas en un solo aviso** («💊 Omeprazol 20 mg + Tiroides 50 µg»), con la nota y «No comer hasta las 08:30».
- Las tomas que pasan de medianoche van al día siguiente.
- **iPhone**: en Calendario crea un calendario «Medicación» (Calendarios → Añadir calendario). Abre el archivo descargado, pulsa **«Añadir todo»** y elige «Medicación». El iPhone avisará **aunque la app no se abra nunca**.
- **Android**: Samsung Calendar lo importa directamente. Con Google Calendar, impórtalo desde el ordenador (calendar.google.com → Configuración → Importar).
- **Si cambia la pauta**, la app lo detecta y muestra en Hoy **«Volver a exportarlos»**. También avisa cuando quedan menos de 14 días de avisos. Para no duplicar: borra el calendario «Medicación» del teléfono, vuelve a crearlo e importa el archivo nuevo.

### 🖨 Hoja semanal imprimible (Medicación → «Hoja semanal»)

Una hoja **A4 apaisada** con 7 días (desde hoy o la semana que viene):

- Una fila por hora y una columna por día.
- Cada toma con su **casilla ☐** para marcar a mano y el aviso **«🍽 no comer hasta…»**.
- Debajo, la pauta de cada medicamento y las horas de referencia.

En el móvil, «Guardar como PDF» o imprimir directamente. Ideal para la nevera o junto al pastillero.

### ✓ «Tomé las N»

En Hoy, las tomas se agrupan por hora. Si a una hora hay varias pendientes, un botón **«✓ Tomé las 2»** las marca todas de un toque.

### Lo de siempre

- **💡 Ideas de mejora** en Ajustes: con saltos de línea, marcar como implementada, editar y borrar.
- **Aviso de copia al entrar**: si pasa **1 mes** o hay **1 cambio** sin copia, configurable en Ajustes. Como marcar tomas cuenta como cambio, el aviso tiene **«Hoy no»** para no insistir más ese día. Con Drive conectado, **«☁️ Subir a Drive»** es un toque.
- **Informe para el médico**: ahora incluye los medicamentos retirados (con fecha), la pauta actual y un botón **Copiar**.

---

## 7. Pruebas realizadas

Con una versión 1 cargada con 5 medicamentos (diario en ayunas, mensual, diario con 3 meses sí y 1 de descanso, lunes, miércoles y viernes, y cada 3 días 3 veces cada 8 h), 54 tomas registradas en 20 días y notas con saltos de línea:

| Prueba | Resultado |
|---|---|
| Medicamentos idénticos tras pasar a la 2.0; 54 de 54 tomas | ✅ |
| **Historial de 14 días idéntico al que daba la versión 1** | ✅ |
| Copia en `window.name` eliminada; original de localStorage conservado; claves de otras apps intactas | ✅ |
| Cambiar la hora de un medicamento hoy → ayer queda igual; hoy, la hora nueva | ✅ |
| Retirar un medicamento → sigue en el informe | ✅ |
| Calendario: 182 avisos en 90 días, cada uno con alarma; agrupados por hora; ciclo de descanso respetado (sin avisos en el mes de descanso); toma de la 01:00 en el día siguiente; líneas dentro del estándar | ✅ |
| Aviso «la pauta ha cambiado, vuelve a exportar» | ✅ |
| Hoja semanal A4 con casillas, «no comer hasta» y leyenda | ✅ |
| Contraseñas en texto claro (localStorage, `window.name`, IndexedDB) | ✅ ninguna |
| Copia cifrada `MCENC1` sin texto legible; restaurar → idéntica | ✅ |
| Restaurar el texto de la versión 1 | ✅ |
| Copia manipulada → rechazada sin tocar nada | ✅ |
| Datos antiguos dañados → solo lectura, sin tocar nada | ✅ |
| Datos solo en `window.name` → se recuperan | ✅ |
| Errores en consola | ✅ ninguno |

**Pendiente (solo tú):**
- **Drive**: Ajustes → **Conectar con Drive** → «Probar y guardar» (debe decir `Apps/Backups/medicamentos`) → **Subir copia ahora**.
- **Calendario**: importar los avisos en el iPhone y comprobar que suena el primero.

---

## 8. Mejoras apuntadas (no implementadas)

1. **Varias personas (ella / tú)**: cada una con su medicación, sus avisos y su informe. Para cuando la necesites tú.
2. **Sincronización entre su iPhone y tu Android** (la misma que en el Gestor de notas, con el puente de Drive): tú configuras la pauta en tu móvil, a ella le aparece en el suyo, y ves si se tomó o lo marcas tú. **Solo merece la pena si ella acaba usando la app**; si no, el calendario y la hoja impresa cubren lo esencial sin que tenga que abrir nada.
3. **Stock de pastillas**: cuántas quedan en la caja y aviso para pedir receta o comprar antes de que se acaben.
4. **Hoja diaria grande** (letra grande, solo el día de hoy), por si la semanal se queda pequeña.
5. **Varias alarmas por toma** en el calendario (por ejemplo, a la hora y 15 minutos después si no se ha tomado). Ojo: el calendario no sabe si ya la tomó, así que la segunda sonaría siempre.
