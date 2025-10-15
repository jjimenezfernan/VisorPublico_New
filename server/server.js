/* Server que se encargara de servir los archivos (geojson, xmls o json) necesarios para la ejecución de la página*/

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const PORT = require("./ip_constants.js");
// Libreria para generar PDF
const { PDFDocument, StandardFonts } = require('pdf-lib');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Dirreciones de los archivos .geojson que necesitas el frontend

// Dirrecion del archivo .geojson para los limites de getafe
const geo_limites_getafe_emsv_path = path.join(__dirname, "resources/map/Limite_Getafe.geojson");

// Dirrecion del archivo .geojson para el visor de emsv para las parcelas CON viviendas
const geo_emsv_parcela_con_vivienda_path = path.join(__dirname, "resources/map/emsv_parcela_con_vivienda.geojson");

// Dirrecion del archivo .geojson para el visor de emsv para las parcelas SIN viviendas
const geo_emsv_parcela_sin_vivienda_path = path.join(__dirname, "resources/map/emsv_parcela_sin_vivienda.geojson");

// Dirrecion del archivo .json para poder buscar el CDID de una calle y numero
const json_emsv_calle_num_reference_path = path.join(__dirname, "resources/map/emsv_calle_num_reference.json");

// Dirrecion del archivo .pdf para generar el PDF
const path_to_pdf = path.join(__dirname, "resources", "pdf", "emsv_pdf_plantilla.pdf");

// Function to read a geojson file and return a promise
function readJsonFile(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const geojson = JSON.parse(data);
      resolve(geojson);
    });
  });
}

// Para mantener en cache los archivos necesarios para el visor de emsv, y no tener que leer todo el rato de memoria
let cachedData = null;

async function loadCache() {
  try {
    cachedData = {
      geo_limites_getafe_emsv: await readJsonFile(geo_limites_getafe_emsv_path),
      json_emsv_calle_num_reference: await readJsonFile(json_emsv_calle_num_reference_path),
      geo_emsv_parcela_con_vivienda: await readJsonFile(geo_emsv_parcela_con_vivienda_path),
      geo_emsv_parcela_sin_vivienda: await readJsonFile(geo_emsv_parcela_sin_vivienda_path),
    };
    console.log("Cache loaded successfully.");
  } catch (err) {
    console.error("Error loading cache:", err);
  }
}

// Llama a loadCache al iniciar el servidor
loadCache();

app.get("/api/visor_emsv", (req, res) => {
  if (!cachedData) {
    console.error("Cache not loaded");
    res.status(500).send("Internal server error");
    return;
  }
  res.json(cachedData);
});

// Leer el archivo PDF existente, así solo lo tiene que leer una vez el server
const existingPdfBytes = fs.readFileSync(path_to_pdf);

// post para generar el PDF con los datos necesarios
app.post('/api/generate_pdf', async (req, res) => {

  // Cargo el PDF
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Obtener la primera página del PDF
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // font Helvetica
  const font = await pdfDoc.embedFont(StandardFonts.Courier);

  // Para centrar el texto en el pdf
  const centrado = 13;
  
  // Insertar texto en la primera página
  // Datos Catrastales
  firstPage.drawText(`Datos Catrastales`, { x: 160, y: 470 - centrado , font, size: 12 });
  firstPage.drawText(`Calle: ${req.body.calle || '-'}`, { x: 170, y: 455 - centrado, font, size: 10 });
  firstPage.drawText(`Número: ${req.body.num || '-'}`, { x: 170, y: 442 - centrado, font, size: 10 });
  firstPage.drawText(`Referencia Catastral: ${req.body.ref_catastral || '-'}`, { x: 170, y: 429 - centrado, font, size: 10 });
  firstPage.drawText(`Tipología del Edificio: ${req.body.tipologia_edificio || '-'}`, { x: 170, y: 416 - centrado, font, size: 10 });
  firstPage.drawText(`Uso Principal: ${req.body.uso_principal || '-'}`, { x: 170, y: 403 - centrado, font, size: 10 });
  firstPage.drawText(`Año de Contrucción: ${req.body.ano_constru || '-'}`, { x: 170, y: 390 - centrado, font, size: 10 });
  firstPage.drawText(`ITE Obligatoria: ${req.body.ite || '-'}`, { x: 170, y: 377 - centrado, font, size: 10 });
  firstPage.drawText(`Barrio: ${req.body.barrio || '-'}`, { x: 170, y: 364 - centrado, font, size: 10 });
  
  // Datos Geograficos para la Convocatoria
  firstPage.drawText(`Datos Geograficos para la Convocatoria`, { x: 160, y: 334 - centrado, font, size: 12 });
  firstPage.drawText(`Conjunto Homogeneo: ${req.body.conj_homo || '-'}`, { x: 170, y: 319 - centrado, font, size: 10 });
  firstPage.drawText(`Especificación del Conjunto Homogeneo: ${req.body.especif_conj_homo || '-'}`, { x: 170, y: 306 - centrado, font, size: 10 });
  firstPage.drawText(`ARRU: ${req.body.arru || '-'}`, { x: 170, y: 293 - centrado, font, size: 10 });
  firstPage.drawText(`ERRP: ${req.body.errp || '-'}`, { x: 170, y: 280 - centrado, font, size: 10 });
  firstPage.drawText(`Distrito: ${req.body.cddistrito || '-'}`, { x: 170, y: 267 - centrado, font, size: 10 });
  
  // Guardar el PDF
  const pdfBytes = await pdfDoc.save();

  // Configurar cabeceras para descargar el PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');
  res.send(Buffer.from(pdfBytes));
  
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

/*-------- Khora credits --------*/
console.log("Created by Khora Urban Thinkers");
console.log("Contact with us in https://khoraurbanthinkers.es/")
console.log("Our X account https://x.com/khoraurban")
console.log("Our Linkedin account https://www.linkedin.com/company/khora-urban-thinkers/posts/?feedView=all")