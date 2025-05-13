import axios from 'axios';

export default async function handler(req, res) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY || req.query.api_key;
    const businessName = req.query.business_name;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Missing API Key. Provide via environment variable or query parameter `api_key`.'
      });
    }

    if (!businessName) {
      return res.status(400).json({
        error: 'Missing required `business_name` parameter.'
      });
    }

    // Step 1: Get Place ID
    const findPlaceResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
      {
        params: {
          key: apiKey,
          input: businessName,
          inputtype: 'textquery',
          fields: 'place_id'
        }
      }
    );

    const candidates = findPlaceResponse.data.candidates;
    if (!candidates || candidates.length === 0) {
      return res.status(404).json({
        error: `No matching business found for: ${businessName}`
      });
    }

    const placeId = candidates[0].place_id;

    // Step 2: Get Detailed Business Info
    const detailsResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          key: apiKey,
          place_id: placeId,
          fields: 'name,formatted_address,place_id,rating,user_ratings_total,website,international_phone_number,business_status,opening_hours,url,reviews,photos'
        }
      }
    );

    const result = detailsResponse.data.result;

    // Flatten Reviews (Up to 5)
    const reviews = result?.reviews
      ? result.reviews.slice(0, 5).map(review => 
          `${review.author_name}: ${review.text} (${review.rating}⭐ - ${review.relative_time_description})`
        )
      : [];

    // Flatten Photos to Simple URLs Using Proxy
    const photos = result?.photos
      ? result.photos.map(photo => 
          `https://gbp-bot.vercel.app/api/photo-proxy?photo_reference=${photo.photo_reference}`
        )
      : [];

    // Flatten Opening Hours (Optional)
    const openingHours = result?.opening_hours?.weekday_text 
      ? result.opening_hours.weekday_text.join(' | ')
      : null;

    return res.status(200).json({
      name: result?.name || null,
      formatted_address: result?.formatted_address || null,
      place_id: result?.place_id || null,
      rating: result?.rating || null,
      user_ratings_total: result?.user_ratings_total || null,
      website: result?.website || null,
      phone: result?.international_phone_number || null,
      business_status: result?.business_status || null,
      opening_hours: openingHours,
      google_maps_url: result?.url || null,
      reviews: reviews,        // Simple array of review strings
      photos: photos           // Simple array of direct image URLs
    });

  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
}
