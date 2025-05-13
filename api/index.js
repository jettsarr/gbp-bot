import axios from 'axios';

export default async function handler(req, res) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || req.query.api_key;
    const businessName = req.query.business_name;

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing API Key. Set it in environment variables or provide via query parameter `api_key`.' });
    }

    if (!businessName) {
      return res.status(400).json({ error: 'Missing required `business_name` parameter.' });
    }

    // Step 1: Find Place ID
    const findPlaceResponse = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: {
        key: apiKey,
        input: businessName,
        inputtype: 'textquery',
        fields: 'place_id'
      }
    });

    const candidates = findPlaceResponse.data.candidates;
    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ error: `No matching business found for: ${businessName}` });
    }

    const placeId = candidates[0].place_id;

    // Step 2: Get Business Details by Place ID
    const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        key: apiKey,
        place_id: placeId,
        fields: 'name,formatted_address,place_id,rating,user_ratings_total,website,international_phone_number,business_status,opening_hours,url'
      }
    });

    const result = detailsResponse.data.result;

    // Return Flattened Business Details
    return res.status(200).json({
      name: result?.name || null,
      formatted_address: result?.formatted_address || null,
      place_id: result?.place_id || null,
      rating: result?.rating || null,
      user_ratings_total: result?.user_ratings_total || null,
      website: result?.website || null,
      international_phone_number: result?.international_phone_number || null,
      business_status: result?.business_status || null,
      opening_hours: result?.opening_hours || null,
      url: result?.url || null
    });

  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}