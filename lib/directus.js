import axios from "axios";

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;

// Create axios instance with default config
const directus = axios.create({
  baseURL: `${DIRECTUS_URL}`,
  headers: {
    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Generic fetch function
export const fetchFromDirectus = async (collection, params = {}) => {
  try {
    const response = await directus.get(`/items/${collection}`, { params });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching from ${collection}:`, error);
    throw error;
  }
};

// Generic create function
export const createInDirectus = async (collection, data) => {
  try {
    const response = await directus.post(`/items/${collection}`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error creating in ${collection}:`, error);
    throw error;
  }
};

// Fetch single item
export const fetchSingleFromDirectus = async (collection, id) => {
  try {
    const response = await directus.get(`/items/${collection}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching ${collection} item ${id}:`, error);
    throw error;
  }
};

// Update item
export const updateInDirectus = async (collection, id, data) => {
  try {
    const response = await directus.patch(`/items/${collection}/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating ${collection} item ${id}:`, error);
    throw error;
  }
};

// Delete item
export const deleteFromDirectus = async (collection, id) => {
  try {
    await directus.delete(`/items/${collection}/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting ${collection} item ${id}:`, error);
    throw error;
  }
};

// Specific API functions for the app

// Events
export const getEvents = async (filters = {}) => {
  return fetchFromDirectus("events", {
    filter: filters,
    sort: ["date"],
  });
};

export const getEventBySlug = async (slug) => {
  const events = await fetchFromDirectus("events", {
    filter: { slug: { _eq: slug } },
  });
  return events?.[0] || null;
};

// Sponsors
export const getSponsors = async () => {
  return fetchFromDirectus("sponsors", {
    sort: ["-contribution_amount"],
  });
};

// Players
export const getPlayers = async (filters = {}) => {
  return fetchFromDirectus("players", {
    filter: filters,
    sort: ["name"],
  });
};

export const getPlayerById = async (id) => {
  return fetchSingleFromDirectus("players", id);
};

export const registerPlayer = async (playerData) => {
  return createInDirectus("players", {
    ...playerData,
    status: "Available",
    date_created: new Date().toISOString(),
  });
};

// Event Registrations
export const registerForEvent = async (registrationData) => {
  return createInDirectus("registrations", {
    ...registrationData,
    date_created: new Date().toISOString(),
  });
};

export default directus;
