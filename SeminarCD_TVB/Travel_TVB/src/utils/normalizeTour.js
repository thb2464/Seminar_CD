import config from '../config/strapi';

const absoluteUrl = (url, fallback) => {
  if (!url) return fallback;
  return url.startsWith('http') ? url : `${config.STRAPI_URL}${url}`;
};

const normalizeHighlights = (highlights = []) =>
  highlights.map((highlight) => ({
    ...highlight,
    Highlight_Text:
      highlight.Highlight_Text ||
      highlight.title ||
      highlight.description ||
      '',
  }));

export const normalizeTour = (tour) => {
  const category = tour.tour_category || tour.category || null;
  const gallery = tour.Gallery || tour.gallery || [];
  const name = tour.Tour_Name || tour.tourName || '';

  return {
    ...tour,
    Tour_Name: name,
    Short_Description: tour.Short_Description || tour.shortDescription || '',
    Description: tour.Description || tour.description || [],
    Region: tour.Region || tour.region || '',
    Location: tour.Location || tour.location || '',
    Departure_Location: tour.Departure_Location || tour.departureLocation || '',
    Price: tour.Price ?? tour.price,
    Original_Price: tour.Original_Price ?? tour.originalPrice,
    Child_Price: tour.Child_Price ?? tour.childPrice,
    Duration_Days: tour.Duration_Days ?? tour.durationDays,
    Duration_Nights: tour.Duration_Nights ?? tour.durationNights,
    Max_Participants: tour.Max_Participants ?? tour.maxParticipants,
    Rating: tour.Rating ?? tour.rating,
    Review_Count: tour.Review_Count ?? tour.reviewCount,
    Transport_Type: tour.Transport_Type || tour.transportType || '',
    Highlights: normalizeHighlights(tour.Highlights || tour.highlights || []),
    Itinerary: tour.Itinerary || tour.itinerary || [],
    Gallery: gallery,
    tour_category: category,
    categoryName: category?.Category_Name || category?.categoryName || category?.name || '',
    featuredImageUrl: absoluteUrl(
      tour.Featured_Image?.url || tour.featuredImageUrl,
      'https://picsum.photos/seed/tour/400/300',
    ),
    galleryImages: gallery.map((img) => ({
      url: absoluteUrl(img.url, 'https://picsum.photos/seed/tour-gallery/800/600'),
      alt: img.alternativeText || img.alt || name,
    })),
  };
};
