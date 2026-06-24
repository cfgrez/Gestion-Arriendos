// Valor de la UF: consulta mindicador.cl y guarda en caché local.
// La caché se gestiona desde DataContext (store 'config'), aquí solo
// está la lógica de consulta remota y parseo.

// Devuelve el valor de la UF para una fecha ISO (YYYY-MM-DD).
// Lanza error si no se puede obtener.
export async function consultarUF(fechaISO) {
  const [y, m, d] = fechaISO.split('-')
  const url = `https://mindicador.cl/api/uf/${d}-${m}-${y}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('No se pudo consultar la UF (HTTP ' + resp.status + ')')
  const data = await resp.json()
  if (data && Array.isArray(data.serie) && data.serie.length > 0) {
    return Number(data.serie[0].valor)
  }
  throw new Error('Respuesta de UF inesperada')
}

// Valor más reciente publicado
export async function consultarUFActual() {
  const resp = await fetch('https://mindicador.cl/api/uf')
  if (!resp.ok) throw new Error('No se pudo consultar la UF (HTTP ' + resp.status + ')')
  const data = await resp.json()
  if (data && Array.isArray(data.serie) && data.serie.length > 0) {
    return { valor: Number(data.serie[0].valor), fecha: data.serie[0].fecha?.slice(0, 10) }
  }
  throw new Error('Respuesta de UF inesperada')
}
