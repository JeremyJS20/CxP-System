// Validación de Cédula (11 dígitos) y RNC (9 dígitos) de República Dominicana.
// Algoritmos basados en: https://www.dgii.gov.do (módulo 10 y módulo 11).

function soloDigitos(valor: string): string {
  return valor.replace(/[^0-9]/g, '');
}

// ─── Cédula: 11 dígitos, módulo 10 ───
// Multiplicadores: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
// Si el producto >= 10 se suman sus dígitos. La suma total debe ser múltiplo de 10.
export function isValidCedula(pCedula: string): boolean {
  const vcCedula = soloDigitos(pCedula);
  if (vcCedula.trim().length !== 11) return false;

  const digitoMult = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  let vnTotal = 0;

  for (let vDig = 0; vDig < 11; vDig++) {
    let vCalculo = parseInt(vcCedula[vDig], 10) * digitoMult[vDig];
    if (vCalculo < 10) {
      vnTotal += vCalculo;
    } else {
      const s = String(vCalculo);
      vnTotal += parseInt(s[0], 10) + parseInt(s[1], 10);
    }
  }

  return vnTotal % 10 === 0;
}

// ─── RNC: 9 dígitos, módulo 11 ───
// Primer dígito debe ser 1, 4 o 5. Multiplicadores (primeros 8 dígitos): [7, 9, 8, 6, 5, 4, 3, 2]
// El último dígito es el verificador calculado contra módulo 11.
export function isValidRNC(pRNC: string): boolean {
  const vcRNC = soloDigitos(pRNC);
  if (vcRNC.length !== 9) return false;

  if (!'145'.includes(vcRNC[0])) return false;

  const vDigito = vcRNC[8];
  const digitoMult = [7, 9, 8, 6, 5, 4, 3, 2];
  let vnTotal = 0;

  for (let vDig = 1; vDig <= 8; vDig++) {
    vnTotal += parseInt(vcRNC[vDig - 1], 10) * digitoMult[vDig - 1];
  }

  return (
    (vnTotal % 11 === 0 && vDigito === '1') ||
    (vnTotal % 11 === 1 && vDigito === '1') ||
    String(11 - (vnTotal % 11)) === vDigito
  );
}

// ─── Validación según tipo de persona ───
export function isValidCedulaOrRNC(valor: string, tipoPersona: 'FISICA' | 'JURIDICA'): boolean {
  return tipoPersona === 'FISICA' ? isValidCedula(valor) : isValidRNC(valor);
}