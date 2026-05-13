import type { Page, Route } from '@playwright/test';

export const e2eUser = {
  id: 77,
  username: 'e2e-traveler',
  email: 'traveler@example.com',
  full_name: 'E2E Traveler',
  phone: '0900000000',
  role: 'Authenticated',
  createdAt: '2026-05-13T00:00:00.000Z',
};

const categories = [
  { id: 1, Category_Name: 'Northern Vietnam', Category_Slug: 'northern-vietnam' },
  { id: 2, Category_Name: 'Southern Vietnam', Category_Slug: 'southern-vietnam' },
];

const tours = [
  {
    id: 101,
    slug: 'northern-discovery',
    Tour_Name: 'Northern Discovery',
    Short_Description: 'Hanoi, Ninh Binh, and Ha Long Bay in one journey.',
    Price: '3500000',
    Child_Price: '2500000',
    Original_Price: '4200000',
    Duration_Days: 3,
    Duration_Nights: 2,
    Location: 'Ha Noi',
    Rating: 4.8,
    Review_Count: 128,
    Featured_Image: { url: 'https://picsum.photos/seed/northern-discovery/600/400' },
    tour_category: categories[0],
    Highlights: [
      { Highlight_Text: 'Old Quarter walking tour' },
      { Highlight_Text: 'Ha Long Bay cruise' },
    ],
    Description: [
      { type: 'paragraph', children: [{ text: 'Explore Hanoi and Ha Long Bay with local guides.' }] },
    ],
    Itinerary: [
      { type: 'paragraph', children: [{ text: 'Day 1: Hanoi arrival and street food walk.' }] },
    ],
    Gallery: [],
    Departure_Location: 'Ha Noi',
    Transport_Type: 'XeKhach',
    Max_Participants: 24,
    createdAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 202,
    slug: 'southern-river',
    Tour_Name: 'Southern River Escape',
    Short_Description: 'A relaxed Mekong Delta weekend.',
    Price: '2800000',
    Child_Price: '2000000',
    Original_Price: null,
    Duration_Days: 2,
    Duration_Nights: 1,
    Location: 'Can Tho',
    Rating: 4.6,
    Review_Count: 84,
    Featured_Image: { url: 'https://picsum.photos/seed/southern-river/600/400' },
    tour_category: categories[1],
    Highlights: [{ Highlight_Text: 'Floating market sunrise' }],
    Description: [
      { type: 'paragraph', children: [{ text: 'Discover river life across the Mekong Delta.' }] },
    ],
    Itinerary: [
      { type: 'paragraph', children: [{ text: 'Day 1: River transfer and orchard visit.' }] },
    ],
    Gallery: [],
    Departure_Location: 'Ho Chi Minh City',
    Transport_Type: 'XeKhach',
    Max_Participants: 18,
    createdAt: '2026-04-20T00:00:00.000Z',
  },
];

const paidBooking = {
  id: 9001,
  tour_name: 'Northern Discovery',
  tour_slug: 'northern-discovery',
  travel_date: '2026-06-15',
  adult_count: 2,
  child_count: 0,
  total_price: '7000000',
  status: 'Paid',
  refund_amount: '0',
  refund_status: null,
};

type MockOptions = {
  appUrl: string;
};

const fulfillJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });

const localeFrom = (url: URL) => url.searchParams.get('locale') || 'en';

const navbarFor = (locale: string) => ({
  data: {
    Navbar_logo: null,
    navigationButtons: [
      { navigationText: locale === 'zh' ? 'Home ZH' : locale === 'vi' ? 'Home VI' : 'Home', path: '/' },
      { navigationText: locale === 'zh' ? 'Tours ZH' : locale === 'vi' ? 'Tours VI' : 'Tours', path: '/tours' },
      { navigationText: locale === 'zh' ? 'Contact ZH' : locale === 'vi' ? 'Contact VI' : 'Contact', path: '/contact' },
    ],
    Nav_button: {
      Text: locale === 'zh' ? 'Contact ZH' : locale === 'vi' ? 'Contact VI' : 'Contact Us',
      Url: '/contact',
    },
  },
});

const footer = {
  data: {
    Menu1_Title: 'Company',
    Footer_Menu1_Item: [{ text: 'About', path: '/about' }],
    Menu2_Title: 'Explore',
    Footer_Menu2_Item: [{ text: 'Tours', path: '/tours' }],
    Contact_Title: 'Contact',
    Contact_Item: [{ label: 'Email:', value: 'hello@example.com' }],
    Footer_Address_Title: 'Address',
    Footer_Address: 'Da Nang. Viet Nam.',
    Copyright: 'Travel TVB',
    Terms_and_Services: [{ text: 'Terms', path: '/terms' }],
  },
};

const newsletter = {
  data: {
    Newsletter_banner_Text: 'Get travel ideas from Travel TVB',
    Newsletter_button_text: 'Subscribe',
  },
};

const tourListResponse = (data = tours) => ({
  data,
  meta: { pagination: { page: 1, pageSize: 9, pageCount: 1, total: data.length } },
});

export async function mockGateway(page: Page, options: MockOptions): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/layout-navbar') {
      return fulfillJson(route, navbarFor(localeFrom(url)));
    }

    if (path === '/api/layout-footer') {
      return fulfillJson(route, footer);
    }

    if (path === '/api/layout-newsletter') {
      return fulfillJson(route, newsletter);
    }

    if (path === '/api/tour-categories') {
      return fulfillJson(route, { data: categories });
    }

    if (path === '/api/tours') {
      const slug = url.searchParams.get('filters[slug][$eq]');
      if (slug) {
        return fulfillJson(route, tourListResponse(tours.filter((tour) => tour.slug === slug)));
      }
      return fulfillJson(route, tourListResponse());
    }

    if (path === '/api/auth/local/register' && method === 'POST') {
      return fulfillJson(route, { jwt: 'e2e-token', user: e2eUser });
    }

    if (path === '/api/auth/local' && method === 'POST') {
      return fulfillJson(route, { jwt: 'e2e-token', user: e2eUser });
    }

    if (path === '/api/users/me') {
      return fulfillJson(route, e2eUser);
    }

    if (path === '/api/bookings/availability') {
      return fulfillJson(route, { data: { remaining: 12, isSoldOut: false } });
    }

    if (path === '/api/bookings' && method === 'POST') {
      return fulfillJson(route, { data: { id: paidBooking.id, status: 'Pending' } });
    }

    if (path === '/api/bookings/my-bookings') {
      return fulfillJson(route, { data: [paidBooking] });
    }

    if (path === `/api/bookings/${paidBooking.id}/cancel` && method === 'POST') {
      return fulfillJson(route, {
        data: {
          ...paidBooking,
          status: 'Cancelled',
          refund_amount: '7000000',
          refund_status: 'refunded',
          cancelled_at: '2026-05-13T12:00:00.000Z',
        },
      });
    }

    if (path === '/api/payments/create-url' && method === 'POST') {
      return fulfillJson(route, {
        paymentUrl: `${options.appUrl}/payment-return?status=success&bookingId=${paidBooking.id}`,
      });
    }

    if (path === '/api/chatbot/query' && method === 'POST') {
      return fulfillJson(route, {
        data: {
          reply: 'Northern Discovery is grounded in the catalog and fits your mountain request. [northern-discovery]',
          sources: [
            {
              tourSlug: 'northern-discovery',
              tourName: 'Northern Discovery',
              price: '3,500,000 VND',
              location: 'Ha Noi',
            },
          ],
        },
      });
    }

    if (method === 'POST') {
      return fulfillJson(route, { data: { id: 1 } });
    }

    return fulfillJson(route, { data: null });
  });
}

export async function seedAuthenticatedSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('jwt_token', 'e2e-token');
  });
}
