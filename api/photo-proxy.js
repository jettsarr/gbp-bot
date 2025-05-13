import axios from 'axios';

export default async function handler(req, res) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || req.query.api_key;
    const photoReference = req.query.photo_reference;

    if (!apiKey || !photoReference) {
      return res.status(400).json({
        error: 'Missing required `api_key` or `photo_reference` parameter.'
      });
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/photo',
      {
        params: {
          maxwidth: 400,
          photo_reference: photoReference,
          key: apiKey
        },
        responseType: 'stream',
        maxRedirects: 5
      }
    );

    // Forward the Content-Type and stream the image directly to the client
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);

  } catch (error) {
    console.error('Photo Proxy Error:', error.message);
    return res.status(500).json({
      error: 'Unable to fetch photo.',
      details: error.message
    });
  }
}
