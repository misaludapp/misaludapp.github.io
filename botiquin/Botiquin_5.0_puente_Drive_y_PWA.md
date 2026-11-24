# Botiquín 5.0 · Seguridad solo para el puente de Drive + PWA

Resultado de aplicar el MD «Seguridad solo para el puente» al Botiquín v4 (`botiquinv4.html`), convertirlo en PWA y revisar la app.

---

## 0. ⚠️ Antes de instalar nada (2 minutos, para no perder datos)

1. **Abre el Botiquín v4 como lo usas ahora** → Ajustes → Copia de seguridad → **Exportar**. Guarda ese JSON en un sitio seguro (Drive, USB). Es tu red de seguridad.
2. **Los datos del navegador pertenecen a la dirección (el «origen»), no al archivo.** La 5.0 verá tus datos **solo si la abres desde el mismo sitio** que la v4:
   - Si hoy abres `https://guitarraapp.github.io/…/botiquinv4.html`, sube la 5.0 a una carpeta del **mismo** `guitarraapp.github.io` (por ejemplo `/botiquin/`) y verás todo tal cual.
   - Si la abrías como archivo del móvil/ordenador (`file://…`) o desde otro dominio, la 5.0 aparecerá vacía: **no se ha perdido nada**. Ve a Ajustes → tarjeta de Drive → «Restaurar desde un archivo» y elige el JSON del paso 1 (la 5.0 lee las copias de la v4).
3. Cierra la pestaña de la v4 antes de abrir la 5.0. La 5.0 actualiza la base de datos (versión 4 → 5, solo **añade** un almacén nuevo); si la v4 sigue abierta, la 5.0 te avisa y no toca nada.

---

## 1. Parámetros usados (fila nueva de la tabla de «usados»)

| App | Prefijo SPX | Claves propias | Carpeta Drive | Cabecera MG | Caché SW |
|---|---|---|---|---|---|
| Botiquín 5.0 | `bt` | `bt_pte` (localStorage, cifrado), `bt_pte_db` (IndexedDB, clave del dispositivo), IndexedDB `botiquin` | `Mi unidad/Apps/Backups/botiquin` | `BTENC1\n` | `botiquin-` |

Comprobado que no coinciden con ninguno de los ya usados (gd, ms, gj, qp, ca, me, gv, th, mu, dv, lr). La app no tenía fases 1-3 (ni contraseña maestra ni huella al entrar), así que corresponde este MD.

Parámetros criptográficos sin tocar: PBKDF2-SHA256 250 000 iteraciones, AES-GCM 256, trozos de 4 MiB, partes de subida de 3 MiB, marca final `GD-FIN`, firma HMAC de las peticiones al puente. El bloque SP es el literal del MD; solo cambian `SPX`, `DAPP` y `MG`.

---

## 2. ¿Está todo en IndexedDB?

**Casi todo, y ahora sí del todo.**

| Dato | v4 | 5.0 |
|---|---|---|
| Medicamentos, material, cajas, ubicaciones, personas, listas, prompts, ideas | IndexedDB `botiquin` | igual |
| Fotos de recetas | IndexedDB (dentro de cada producto) | igual |
| Ajustes de pantalla (secciones plegadas) y fecha de la última exportación | **localStorage** `botiquin1-cfg` | **IndexedDB** `botiquin` → almacén `meta` |
| Contador de cambios y fecha de última copia (aviso al entrar) | — | IndexedDB, almacén `meta` |
| Conexión con Drive | — | cifrada (ver punto 3) |

La migración copia los ajustes a IndexedDB, los vuelve a leer y los compara. La clave antigua `botiquin1-cfg` se deja en localStorage hasta tu **primera copia de seguridad hecha con la 5.0**; entonces se borra (solo esa clave). Eran datos sin importancia (qué secciones de Ajustes estaban abiertas), pero así no se pierde nada aunque algo fallara.

---

## 3. Contraseñas: ninguna en texto claro

Lo que pide la app al conectar con Drive: **dirección del puente**, **clave del puente** y **contraseña de copias**.

- Las tres se guardan **juntas y cifradas** (AES-GCM) en `localStorage['bt_pte']`. Solo hay letras aleatorias: `{"v":1,"iv":"…","ct":"…"}`.
- La llave que las descifra es una **clave del dispositivo no extraíble** (guardada en IndexedDB `bt_pte_db`). Ni la propia app puede leer sus bytes; solo puede usarla, y nunca sale del navegador.
- **Ninguna viaja por la red**: la clave del puente solo se usa para firmar cada petición (HMAC); la contraseña de copias, para cifrar las copias antes de subirlas.
- Las copias que llegan a Drive van **cifradas** (`.gdc`): quien entre en tu Drive solo verá datos ilegibles.
- Subir copias **no pide nada**. Ver o cambiar los datos del puente, borrar copias de Drive y desconectar piden **huella** (si la activas) o la contraseña de copias.

**Comprobado en la prueba**: después de conectar, recorrí todo localStorage y todas las bases IndexedDB buscando la dirección, la clave y la contraseña: **no aparecen en ningún sitio**. La clave del dispositivo es `CryptoKey` con `extractable: false`.

### Lo que esto NO puede evitar (opinión sincera)

El navegador separa los datos por **dominio**, no por app. Todas tus apps en `guitarraapp.github.io` comparten «casa»: si alguna de ellas tuviera un fallo que permitiera ejecutar código ajeno, ese código podría **usar** (no leer) la clave del dispositivo del Botiquín. Por eso he cerrado los agujeros de esta app (punto 5), pero la protección de fondo es **separar las apps sensibles en otro dominio**. Ya tienes creada la organización **misaludapp**: el Botiquín encaja ahí (`misaludapp.github.io/botiquin/`). Si lo haces, recuerda el punto 0.2: exportar en el sitio viejo y restaurar en el nuevo.

---

## 4. PWA y desinstalación

Archivos: `index.html`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png` (maletín blanco con cruz sobre fondo verde azulado, los colores de la app).

Qué garantiza el código:

- La app **nunca** usa `localStorage.clear()` ni borra bases de datos ajenas.
- El `sw.js` solo borra cachés que empiezan por `botiquin-` y solo atiende archivos de su propia carpeta.
- Al abrir, pide al navegador almacenamiento **persistente** (para que no lo borre si falta espacio).

Qué pasa al desinstalar (esto depende del sistema, no de la app):

| Dónde | Al desinstalar la PWA |
|---|---|
| **Android (Chrome)** | Se quita el icono. **Los datos se quedan** (son del dominio, compartidos con Chrome). No se borra nada de ninguna app. |
| **Ordenador (Chrome/Edge)** | Sale una casilla **«Borrar también los datos de Chrome»**. **No la marques**: borraría los datos de **todo** `guitarraapp.github.io`, es decir, de todas tus apps. Sin marcarla no se borra nada. |
| **iPhone** | Cada app añadida a la pantalla de inicio tiene su propio almacenamiento; al borrarla se borran **solo sus datos**. |

Y nunca uses «Borrar datos de sitios» para github.io en el navegador. Con las copias en Drive, aunque pasara, se recupera todo.

---

## 5. Cambios hechos en la 5.0

**Seguridad y copias**

- Bloque SP del puente de Drive (copias cifradas, restaurar desde Drive en un móvil nuevo, huella opcional para cambios).
- **Aviso al entrar** si pasa más de **1 mes** o hay **1 cambio** sin copia (los dos valores se cambian en Ajustes). Cuenta altas, cambios y borrados; no cuenta plegar secciones.
- **Restaurar es ahora seguro**. Antes, «Importar» y «Restaurar desde texto» borraban almacén por almacén y luego escribían: un fallo a mitad dejaba la base vacía. Ahora: se lee y valida la copia entera → se descarga una copia previa de lo que tienes → se sustituye todo en **una sola operación** (o se guarda todo o no se toca nada).
- Lee copias de la v4 (y las antiguas con `medicamentos`/`nombreLibre`).
- Rechaza copias manipuladas (identificadores con código escondido) sin tocar nada.
- El **enlace del prospecto** solo funciona si es `http(s)`: un JSON importado con `javascript:` ya no puede ejecutar nada. Las fotos solo se muestran si son imágenes guardadas por la propia app.
- Política de seguridad (CSP): la app solo puede conectarse al puente de Google.

**Comodidad**

- Al guardar algo, la pantalla **ya no salta arriba** si sigues en la misma vista (antes, al editar una caja de una lista larga, perdías el sitio).
- **Ideas y mejoras**: ahora se pueden **editar**, reabrir y respetan los saltos de línea; borrar pide confirmación.
- Versión visible en «Acerca de».

---

## 6. Pruebas realizadas

En Chrome, con una v4 llena de datos de prueba (60 productos, 60 cajas, foto de receta, persona, lista, idea, ajustes) y abriendo la 5.0 encima:

| Prueba | Resultado |
|---|---|
| Datos idénticos tras actualizar v4 → 5.0 | ✅ |
| Ajustes migrados a IndexedDB, original conservado hasta la primera copia | ✅ |
| Aviso de copia al entrar | ✅ |
| Contraseñas en texto claro en localStorage/IndexedDB | ✅ ninguna |
| Clave del dispositivo no extraíble; la conexión se descifra tras recargar | ✅ |
| Copia cifrada: empieza por `BTENC1`, sin texto legible dentro | ✅ |
| Restaurar copia cifrada (descarga antes la copia previa) | ✅ datos idénticos |
| Contraseña equivocada → la pide otra vez → «no se ha tocado nada» | ✅ |
| Restaurar una copia de la v4 pegada como texto | ✅ datos idénticos |
| Copia manipulada → rechazada sin tocar nada | ✅ |
| Prospecto `javascript:` → no se convierte en enlace | ✅ |
| Exportar sin cifrar → contador a 0 y se libera la clave antigua | ✅ |
| Service worker registrado; solo caché `botiquin-v5-0` | ✅ |
| Errores en consola | ✅ ninguno |

---

## 7. Pendiente (lo que solo puedes probar tú)

1. Exportar la v4 (punto 0) y subir los archivos de la 5.0 a la carpeta elegida.
2. Abrir la 5.0 y comprobar que están todos tus productos y cajas.
3. Ajustes → **Conectar con Drive** con la misma dirección y clave del puente de tus otras apps, y tu contraseña de copias → «Probar y guardar». Debe responder `Conectado · Apps/Backups/botiquin`.
4. **Subir copia ahora** y mirar en Drive que aparece la carpeta `botiquin` con el archivo cifrado. (No he podido probar la conexión real con Google desde aquí.)
5. Instalar como app (menú de Chrome → «Instalar aplicación» o «Añadir a pantalla de inicio») y abrirla sin conexión.
6. Si decides moverla a `misaludapp`, hacerlo ahora que aún no la usas: exportar → subir allí → restaurar.

---

## 8. Mi opinión sincera sobre la app

**Lo que está muy bien.** El modelo es el correcto: un **producto** (la ficha) y sus **cajas** (dónde está, caducidad, estado). La búsqueda por alias, principio activo y «para qué sirve» es justo lo que necesitas con el dolor de cabeza puesto. La portada con «Reponer» y «Próximas caducidades» es útil desde el primer día. La detección de duplicados por principio activo + dosis + forma (marca blanca vs. marca) y la caducidad tras abrir están muy bien pensadas. Las plantillas y el PDF por ubicación son un buen extra.

**Lo que más fricción te va a dar** (por orden de impacto; no lo he programado, espero tu OK):

1. **Carga inicial con IA en un solo paso.** Ahora son dos prompts (foto → ficha en texto, y luego texto → JSON), guardar el JSON como archivo e importarlo. Propuesta: un único prompt «foto → JSON» y un cuadro para **pegar** el JSON en «Importar catálogo parcial», sin archivos. Es lo que más tiempo te ahorrará al empezar.
2. **Caducidad con mes y año.** Las cajas traen «CAD 03/2027», sin día, y el selector obliga a elegir día. Un selector de mes/año (guardando el último día del mes) quita un paso en cada caja.
3. **Botón rápido «Queda poco / No queda»** en cada caja. El código ya tiene esa acción (`estado`), pero no hay ningún botón que la use. Hoy hay que abrir el formulario de la caja.
4. **Recordar la última ubicación** al añadir cajas. Si estás metiendo el botiquín de montaña, que no haya que elegirlo cada vez.
5. **«Lo abro hoy»** en medicamentos que caducan al abrirse (colirios, jarabes): un toque que pone la fecha de apertura.
6. **Lista de la compra**: en «Reponer», un botón para copiar o compartir la lista (WhatsApp, notas).
7. **Avisos propios en vez de las ventanas del navegador** (`alert`, `confirm`, `prompt`). Por ejemplo, «✓ Copiado» como aviso que desaparece solo, sin tener que pulsar Aceptar.
8. **Pestaña «Medicamentos» → «Catálogo»**, porque también contiene el material de curas.
9. **Listas comparadas con la ubicación**: «¿qué le falta a mi botiquín de montaña?», comparando la plantilla con lo que hay en esa ubicación, en vez de marcar a mano.
10. **Contador en la pestaña Buscar** (por ejemplo «Buscar · 3») cuando hay algo caducado o por reponer, para verlo sin entrar.

**Para más adelante (requiere decisión de seguridad):** escanear el código de la caja y traer la ficha y el prospecto oficiales del CIMA (Agencia Española del Medicamento). Sería muy cómodo, pero supone abrir la app a un servicio externo. Lo dejaría para después de mover la app a `misaludapp`.

**Detalles menores que he visto:** borrar un producto borra todas sus cajas sin «deshacer»; el orden de las ubicaciones no se puede cambiar desde la app; las fotos de recetas engordan las copias (no es problema con el puente, que sube por partes).
