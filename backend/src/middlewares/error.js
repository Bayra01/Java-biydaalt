function notFound(req, res) {
  res.status(404).json({ error: 'Endpoint олдсонгүй' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // PostgreSQL алдаанууд
  if (err.code === '23P01') {
    return res.status(409).json({ error: 'Өрөө энэ хугацаанд эзлэгдсэн байна (давхар захиалга хориглоно)' });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ийм утга аль хэдийн бүртгэлтэй байна' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Холбогдох бичлэг олдсонгүй' });
  }
  if (err.code === '22P02' || err.code === '22007') {
    return res.status(400).json({ error: 'Буруу утгын формат' });
  }
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Серверийн алдаа' });
}

module.exports = { notFound, errorHandler };
