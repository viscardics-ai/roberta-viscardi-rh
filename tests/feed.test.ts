import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sources } from '../src/catalog'
import { classify, parseFeed, plain } from '../server/feed'
import { fetchSource } from '../server/update'

const tst = sources.find(item => item.id === 'tst')!
const economy = sources.find(item => item.id === 'agencia')!

test('sanitiza o resumo, canonicaliza a URL e filtra notícia irrelevante', async () => {
  const xml = `<rss><channel>
    <item><title>Mercado de trabalho: novas vagas &amp; emprego</title><link>http://news.example.org/emprego/?utm_source=a&amp;ref=1#demo</link>
    <description><![CDATA[<p>Relatório publicado hoje</p><script>instruções externas</script>]]></description><pubDate>Wed, 25 Nov 2026 10:00:00 GMT</pubDate></item>
    <item><title>Previsão de chuva</title><link>https://news.example.org/clima</link></item>
    <item><title>Emprego</title><link>javascript:alert(1)</link></item>
  </channel></rss>`
  const [entry, ...remaining] = await parseFeed(xml,economy,Date.parse('2026-11-25T14:00:00Z'))
  assert.equal(entry.entry.summary, 'Relatório publicado hoje')
  assert.equal(entry.entry.url,'https://news.example.org/emprego?ref=1')
  assert.match(entry.entry.title, /& emprego/)
  assert.deepEqual(remaining,[])
})

test('aceita Atom, preserva a fonte e reconhece tema trabalhista', async () => {
  const [item] = await parseFeed('<feed><entry><title>TST julga demanda sobre assédio moral</title><summary>Entenda o contexto</summary><link rel="alternate" href="https://www.tst.jus.br/noticia"/><author><name>Imprensa TST</name></author></entry></feed>', tst)
  assert.equal(item.entry.author,'Imprensa TST')
  assert.equal(item.entry.category,'Legislação')
  assert.match(item.entry.legalStatus ?? '', /consulte a fonte oficial/)
  assert.ok(classify('Setor imobiliário em Porto Alegre', '', economy).score >= 7)
})

test('rejeita DTD e separa texto do conteúdo não confiável', async () => {
  await assert.rejects(parseFeed('<!DOCTYPE rss><rss></rss>', economy))
  assert.equal(plain('&lt;b&gt;RH&lt;/b&gt; &#x1f4a1;<style>oculto</style>'), 'RH 💡')
})

test('usa cache HTTP e rejeita destinos não cadastrados', async () => {
  const upstream: typeof fetch = async (_url, init) => {
    assert.equal(new Headers(init?.headers).get('If-None-Match'), '"a"')
    assert.equal(init?.redirect,'error')
    return new Response(null,{ status: 304 })
  }
  const result = await fetchSource(economy, { etag: '"a"', modified: null }, upstream)
  assert.deepEqual(result.items,[])
  await assert.rejects(fetchSource({ ...economy, feed: 'https://example.org/canal.xml' },undefined,upstream))
})
