
# ⏳ Chronicle – Timeline Builder

**Chronicle** és una eina web avançada, 100% *client-side*, dissenyada per a docents i alumnes que necessiten crear visualitzacions temporals clares, potents i estètiques. Permet des de l'estudi de biografies fins a escales geològiques complexes.

## 🚀 Funcionalitats Principals

### 1. Gestió d'Esdeveniments
- **Dates Flexibles:** Suporta anys sols (ex: `1492`), dates completes (`YYYY-MM-DD`) o fins i tot anys negatius per a l'antiguitat.
- **Rangs Temporals:** Si s'afegeix una data final, l'esdeveniment es visualitza com una **barra de període**.
- **Multimèdia:** Enllaça imatges o vídeos de YouTube que es previsualitzen directament a la línia.
- **Codificació de Colors:** Personalitza cada esdeveniment amb colors predefinits o mitjançant un selector lliure (icona de la pipeta 🖌️).

### 2. Modes de Visualització
- **Orientació:** Commuta entre mode **Horitzontal** (clàssic) i **Vertical** (ideal per a dispositius mòbils o llistes llargues).
- **Escala Temporal:**
  - **Proporcional:** L'espai entre punts reflecteix el temps real transcorregut (inclou reixeta de referència).
  - **Comprimida:** Redueix els buits buits per centrar-se en el contingut, mantenint l'ordre cronològic.
- **Mode Desplaçament (Scroll):** Permet crear línies extremadament llargues sense comprimir els elements, ideal per a projectes amb molta densitat d'informació.

### 3. Disseny i Estètica (UX/UI)
- **Mode Fosc:** Adaptació completa per a entorns amb poca llum o preferències estètiques modernes.
- **Gestió de Solapaments:** En esdeveniments de tipus "període", les barres es col·loquen **paral·lelament en carrils** automàtics per evitar que s'encavalquin.
- **Focus Intel·ligent:** En fer *hover* sobre un element, aquest passa al davant (*z-index*), facilitant la lectura en zones denses.
- **Alineació Precisa:** Tant els punts com les línies de referència de la reixeta utilitzen el mateix càlcul matemàtic per garantir una precisió absoluta.

### 4. Exportació i Seguretat
- **Sense Registre:** Totes les dades es guarden localment al navegador (*LocalStorage*).
- **Exportació PNG:** Genera una imatge d'alta resolució (fins a 3x) de tota la línia, incloent les parts que no es veuen en pantalla.
- **Compatibilitat Excel (XLSX):** Exporta les dades per fer-ne còpies de seguretat o importa fitxers Excel per treballar col·laborativament o massivament.

## 🛠️ Stack Tecnològic

- **React 19:** Lògica de components i estat reactiu.
- **Tailwind CSS:** Disseny responsiu i estilització moderna.
- **html2canvas:** Motor de renderitzat per a l'exportació d'imatges.
- **SheetJS (XLSX):** Processament de dades en format full de càlcul.
- **TypeScript:** Robustesa i seguretat en el codi.

## �️ Desenvolupament (Running Locally)

Si vols fer canvis en el codi o executar-lo en el teu entorn local:

### 1. Requisits
- [Node.js](https://nodejs.org/) instal·lat.

### 2. Instal·lació
```bash
# Instal·la les dependències
npm install
```

### 3. Execució en desenvolupament
```bash
# Llança el servidor local (Vite)
npm run dev
```
Obre `http://localhost:5173` al teu navegador.

### 4. Construcció per a producció
```bash
# Genera els arxius a la carpeta /dist
npm run build
```

---
*Creat amb focus en l'excel·lència educativa i la claredat visual.*
