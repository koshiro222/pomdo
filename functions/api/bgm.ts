import { Hono } from 'hono'

type Bindings = {
  BGM_BUCKET: R2Bucket
}

const bgm = new Hono<{ Bindings: Bindings }>()

bgm.get('/:filename', async (c) => {
  const filename = c.req.param('filename')

  // ファイル名のバリデーション（スラッシュを含むパス構造を許可）
  if (!filename.match(/^[a-z0-9-\/]+\.(mp3)$/i)) {
    return c.json({ error: 'Invalid filename' }, 400)
  }

  const object = await c.env.BGM_BUCKET.get(filename)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, {
    headers,
    status: 200,
  })
})

export default bgm
