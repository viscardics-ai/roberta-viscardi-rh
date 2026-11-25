import { expect, test } from '@playwright/test'
import type { Entry, PortalData } from '../src/model'

test('abre carrossel, mantém favoritos e histórico, exporta uma leitura', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Gestão de Pessoas no Setor Imobiliário/ })).toBeVisible()
  await page.getByRole('button', { name: /^Destaque 2:/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: /NR-1 em 2026/ })).toBeVisible()
  await page.getByRole('link', { name: 'Ler análise completa' }).click()
  await expect(page.getByRole('heading', { name: 'Fontes e evidências' })).toBeVisible()
  await page.getByRole('button', { name: 'Salvar matéria' }).click()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar texto' }).click()])
  expect(download.suggestedFilename()).toBe('nr-1-riscos-psicossociais.txt')
  await page.getByRole('link', { name: 'Favoritos', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('link', { name: /NR-1 em 2026/ })).toBeVisible()
  await page.getByRole('link', { name: 'Notificações e histórico' }).click()
  await expect(page.getByRole('link', { name: /NR-1 em 2026/ })).toBeVisible()
})

test('pesquisa sem acentos, filtra o acervo e navega por editorias', async ({ page }) => {
  await page.goto('/')
  const search = page.getByRole('textbox', { name: /Buscar notícias/ })
  await search.fill('riscos psicossociais')
  await search.press('Enter')
  await expect(page.getByRole('heading', { name: 'Resultados da busca' })).toBeVisible()
  await page.getByLabel('Categoria', { exact: true }).selectOption('Legislação')
  await expect(page.getByRole('link', { name: /NR-1 em 2026/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Formação em Gestão dos Riscos Psicossociais' })).toHaveCount(0)
  const menu = page.getByRole('navigation', { name: 'Menu principal' })
  for (const title of ['Notícias','Análises','Tendências','Carreira e Liderança','Legislação e Compliance','Estudos','Na Prática']) {
    await menu.getByRole('link', { name: title, exact: true }).click()
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
  }
  await page.getByRole('link', { name: 'Biblioteca', exact: true }).click()
  await page.getByLabel('Tipo', { exact: true }).selectOption('Modelo')
  await expect(page.getByRole('link', { name: /Roteiro de conversa/ })).toBeVisible()
})

test('atualiza por API e exibe o estado retornado pela coleta', async ({ page }) => {
  let updateCalls = 0
  await page.route('**/api/portal', async route => route.fulfill({ json: { state: 'online', entries: [], update: updateCalls ? { time: '2026-11-25T10:00:00Z', state: 'partial', added: 2, failures: ['CBIC'], ai: 'IA desativada.' } : null } }))
  await page.route('**/api/update', async route => {
    expect(route.request().method()).toBe('POST')
    updateCalls++
    await route.fulfill({ json: { state: 'partial', added: 2 } })
  })
  await page.goto('/')
  await expect(page.getByText('Aguardando a primeira coleta.')).toBeVisible()
  await page.getByRole('button', { name: 'Atualizar portal', exact: true }).last().click()
  await expect(page.getByText(/Concluída com indisponibilidades/)).toHaveText(/2 novos conteúdos.*CBIC/)
  expect(updateCalls).toBe(1)
})

test('comunica inscrições e área editorial indisponíveis na versão estática', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quero receber' }).click()
  await expect(page.getByText('Inscrições para a curadoria ainda indisponíveis.')).toBeVisible()
  await page.getByRole('link', { name: 'Área editorial' }).click()
  await expect(page.getByText('Servidor do portal indisponível neste ambiente.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Publicar versão' })).toHaveCount(0)
})

for (const [width, height] of [[1920, 920], [1366, 768], [1280, 720]]) {
  test('exibe destaques completos e curadoria na tela inicial de ' + width + ' × ' + height, async ({ page }) => {
    const titles = [
      'Seconci-Rio completa 38 anos com mais de 6 milhões de atendimentos realizados para os trabalhadores da construção',
      'MTE detalha regras para implementação da escala 5×2 e redução da jornada de trabalho',
      'Deu na mídia: Presidente da CBIC alerta para impactos do fim da escala 6×1 na construção civil',
    ]
    const entries: Entry[] = titles.map((title, index) => ({
      id: 'noticia-' + index,
      title,
      summary: title,
      category: 'Mercado & Pessoas',
      kind: 'Notícia',
      themes: ['mercado'],
      level: 'Introdução',
      source: 'CBIC',
      date: new Date().toISOString(),
      evidence: 'rss',
      minutes: 1,
    }))
    const portal: PortalData = { state: 'online', entries, update: null }
    await page.route('**/api/portal', route => route.fulfill({ json: portal }))
    await page.setViewportSize({ width, height })
    await page.goto('/')
    const weekly = page.locator('.weekly')
    for (const title of titles) await expect(weekly.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)

    await expect(weekly).toBeInViewport({ ratio: 1 })
    await expect(page.locator('.newsletter')).toBeInViewport({ ratio: 1 })
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })
}

for (const [width, height] of [[1536,1024],[1920,1080],[1366,768],[1440,900],[390,844]]) {
  test('valida e captura a tela ' + width + ' × ' + height, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await page.locator('.hero img').evaluate((image: HTMLImageElement) => image.decode())
    await page.evaluate(() => document.fonts.ready)
    await expect(page.getByRole('link', { name: 'Ler análise completa' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    if (process.env.PORTAL_SCREENSHOTS) await page.screenshot({ path: process.env.PORTAL_SCREENSHOTS + '/portal-' + width + 'x' + height + '.png', animations: 'disabled' })
    if (width === 1536) {
      const hero = await page.locator('.hero').boundingBox()
      const sidebar = await page.locator('.sidebar').boundingBox()
      expect(hero?.x).toBeCloseTo(42, 0)
      expect(hero?.y).toBeCloseTo(172, 0)
      expect(hero?.height).toBeCloseTo(326, 0)
      expect(Math.abs((sidebar?.x ?? 0) - 1064)).toBeLessThan(3)
    }
    if (width < 620) {
      await page.getByRole('button', { name: 'Abrir menu' }).click()
      await page.getByRole('link', { name: 'Carreira e Liderança', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Carreira e Liderança', level: 1 })).toBeVisible()
    }
  })
}
