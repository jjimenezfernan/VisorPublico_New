// Objetivo: Contiene un mapa en id de las claves de los datos de la API de EMSV y su correspondiente que se mostrar al usuario.

const mapEmsvKeys = new Map();
// Datos catastrales
mapEmsvKeys.set("calle_num", "Calle y Número");
mapEmsvKeys.set("ref_catastral", "Referencia Catastral");
mapEmsvKeys.set("tipologia_edificio", "Tipología de Edificio");
mapEmsvKeys.set("uso_principal", "Uso Principal");
mapEmsvKeys.set("ano_constru", "Año de Contruccion");
mapEmsvKeys.set("ite", "ITE Obligatoria");
mapEmsvKeys.set("barrio", "Barrio");

// Datos Energéticos
mapEmsvKeys.set("demanda_calefaccion","Demanda de Calefacción")
mapEmsvKeys.set("calificacion_demanda_calefaccion","Certificado Energético")
mapEmsvKeys.set("cert_emision_co2","Certificado Emisión CO2")
mapEmsvKeys.set("cert_consumo_e_primaria","Certificado Consumo Energía Primaria")
mapEmsvKeys.set("prod_fotovol","Potencial Producción Fotovoltaica")
mapEmsvKeys.set("irradiacion_anual_kwh/m2","Irradiación Anual (kWh/m2)")

// Datos Geográficos Para Convocatorias
mapEmsvKeys.set("conj_homo","Conjunto Homogeneo")
mapEmsvKeys.set("especif_conj_homo","Especificación del Conjunto Homogeneo")
mapEmsvKeys.set("ARRU","Ámbito ARRU")
mapEmsvKeys.set("ERRP","Ámbito ERRP")
mapEmsvKeys.set("CDDISTRITO","Distrito")

export { mapEmsvKeys };
