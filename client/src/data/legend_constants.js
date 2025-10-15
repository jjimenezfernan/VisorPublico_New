/** 
 * Archivo que contiene las constantes de los colores de los gradientes de las leyendas de los mapas y 
  las funciones que devuelven la posicion del color (en unso de los arrays de COLORMAP) en el gradiente dependiendo del valor seleccionado
  Sabemos que seria mejor iterar por valores que por gradiente en MapLegendeEMSV.jsx, pero hemos decidio dejarlo mejor por gradiente simplemente por cuestiones de tiempo
 * TODO generalizar las funciones de que buscan la key del gradiente del color 
  */

const COLORMAP = {
  generic: ["#a63564", "#8a4d85", "#48669c", "#4a86a8", "#63a7b8"],
  cert: [
    "#047331",
    "#388C04",
    "#5498A9",
    "#508CAE",
    "#607CAC",
    "#8C5788",
    "#CA0300",
  ],
  si_no: ["#4a86a8", "#bababa"], 
  cd_distrito: ["#a63564", "#8a4d85", "#48669c", "#4a86a8"],
  especif_conj_homo : [
    "#c693f0", "#FFC0CB", "#B0E0E6", "#5F9EA0",  
    "#a8dea8", "#FFDAB9", "#D8BFD8", "#D2B48C", 
    "#FFFACD", "#4682B4", "#008080", "#B0C4DE", 
    "#9DC183", "#556B2F", "#F5DEB3", "#F08080", 
    "#A0522D", "#afafe8", "#AEEEEE", "#7D7098", 
    "#FF9A8A", "#8F9779", "#FFD1DC", "#DC143C" 
  ],
};
  
// Los tipos de selección que se pueden hacer en el mapa en el menú de la derecha, estos cambian 
// el color de los polígonos dependiendo del valor de la capa seleccionada, además de mostrar una leyenda
export const typeOfSelections = {
  ano_constru: {
    key: "ano_constru",
    path: `feature.properties["ano_constru"]`,
    label: "Año de Construción",
    intervalos:{
      0: [Infinity, 2010],
      1: [2010, 1996],
      2: [1995, 1981],
      3: [1980, 1956],
      4: [1955, 0],
    },
    legend: {
      values: [2010, 1995, 1980, 1955, 0],
      gradient: COLORMAP.generic,
    },
  },
  cert_emision_co2: {
    key: "cert_emision_co2",
    path: `feature.properties["cert_emision_co2"]`,
    label: "Certificado emisión CC",
    legend: {
      values: ["A", "B", "C", "D", "E", "F", "G"],
      gradient: COLORMAP.cert,
    },
  },
  conj_homo: {
    key: "conj_homo",
    path: `feature.properties["conj_homo"]`,
    label: "Conjunto Homogeneo",
    legend: {
      values: ["Sí", "No"],
      gradient: COLORMAP.si_no,
    },
  },
  CDDISTRITO: {
    key: "CDDISTRITO",
    path: `feature.properties["CDDISTRITO"]`,
    label: "Distrito",
    legend: {
      values: ["01", "02", "03", "04"],
      gradient: COLORMAP.cd_distrito,
    },
  },
  prod_fotovol: {
    key: "prod_fotovol",
    path: `feature.properties["prod_fotovol"]`,
    label: "Producción Fotovoltaica",
    intervalos:{
      0: [Infinity, 150],
      1: [150, 101],
      2: [100, 51],
      3: [51, 26],
      4: [25, 1],
    },
    legend: {
      values: [150, 100, 50, 25, 0],
      gradient: COLORMAP.generic,
    },
  },
  ARRU: {
    key: "ARRU",
    path: `feature.properties["ARRU"]`,
    label: "Ámbito ARRU",
    legend: {
      values: ["Sí", "No"],
      gradient: COLORMAP.si_no,
    },
  },
  ERRP: {
    key: "ERRP",
    path: `feature.properties["ERRP"]`,
    label: "Ámbito ERRP",
    legend: {
      values: ["Sí", "No"],
      gradient: COLORMAP.si_no,
    },
  },
  especif_conj_homo: {
    key: "especif_conj_homo",
    path: `feature.properties["especif_conj_homo"]`,
    label: "Especificación Conjunto Homogeneo",
    legend: {
      values: ['Sector III - (II)', 'Sector III - (I)', 
          'Sindicatos', 'Las Margaritas', 'Getafe Norte I', 
          'Fátima', 'Heras - Escaño', 'Perales - Peridís', 
          'La Alhóndiga - Hospital', 'Greco', 
          'El Bercial -  Sector 1', 'Salvador', 
          'El Bercial -  Sector B', 'El Bercial - Sector C', 
          'Guardia Civil', 'Brunete', 'Fuerzas Armadas', 'Harinera', 
          'Serranillos - Benavente', 'Pizarro', 'Colonia Militares', 'Juan de la Cierva - Sector A', 
          'Juan de la Cierva - Sector B', 'Juan de la Cierva - Sector C'],
      gradient: COLORMAP.especif_conj_homo,
    },
  },
};

// Función que devuelve la key del intervalo en el que se encuentra el valor para ano_constru
function anoContrucionSelectColor(value) {
  for (const key in typeOfSelections.ano_constru.intervalos) {
    if (
      value <= typeOfSelections.ano_constru.intervalos[key][0] &&
      value >= typeOfSelections.ano_constru.intervalos[key][1]
    ) {
      return key;
    }

  }
}

// Función que devuelve la key del intervalo en el que se encuentra el valor para prod_fotovol
function prodFotovol(value) {
  for (const key in typeOfSelections.prod_fotovol.intervalos) {
    if (
      value <= typeOfSelections.prod_fotovol.intervalos[key][0] &&
      value >= typeOfSelections.prod_fotovol.intervalos[key][1]
    ) {
      return key;
    }
  }
}

// Función que devuelve la key del valor en el gradiente para cert_emision_co2
function certEmisionSelectColor(value){
  return typeOfSelections.cert_emision_co2.legend.values.indexOf(value);
}

// Función que devuelve la key del valor en el gradiente para conj_homo
function conjHomo(value){
  return typeOfSelections.conj_homo.legend.values.indexOf(value);
}

// Función que devuelve la key del valor en el gradiente para CDDISTRITO
function cdDistrito(value){
  return typeOfSelections.CDDISTRITO.legend.values.indexOf(value);
}

// Función que devuelve la key del valor en el gradiente para conj_homo
function arru(value){
  return typeOfSelections.ARRU.legend.values.indexOf(value);
}

// Función que devuelve la key del valor en el gradiente para conj_homo
function errp(value){
  return typeOfSelections.ERRP.legend.values.indexOf(value);
}

// Función que devuelve la key del valor en el gradiente para especif_conj_homo
function especifConjHomo(value){
  return typeOfSelections.especif_conj_homo.legend.values.indexOf(value);
}

// Función que devuelve el color del gradiente dependiendo del valor seleccionado y del valor de este en la capa seleccionada
export function selectColor(selectionValue, layerValueSelect) {
  if (selectionValue === "ano_constru") {
    return anoContrucionSelectColor(layerValueSelect);
  }
  else if (selectionValue === "cert_emision_co2") {
    return certEmisionSelectColor(layerValueSelect);
  }
  else if (selectionValue === "conj_homo") {
    return conjHomo(layerValueSelect);
  }
  else if (selectionValue === "CDDISTRITO") {
    return cdDistrito(layerValueSelect);
  }
  else if (selectionValue === "prod_fotovol") {
    return prodFotovol(layerValueSelect);
  }
  else if (selectionValue === "ARRU") {
    return arru(layerValueSelect);
  }
  else if (selectionValue === "ERRP") {
    return errp(layerValueSelect);
  }
  else if (selectionValue === "especif_conj_homo"){
    return especifConjHomo(layerValueSelect);
  }

} 