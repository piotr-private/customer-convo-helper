
// Configuration service to manage environment variables and secrets
// In a production environment, these would be stored in environment variables
// or fetched from a secure backend service like Supabase

/**
 * Get environment configuration with appropriate defaults
 * This approach allows for future expansion to fetch from backend
 */
export const getConfig = () => {
  // Default configuration - in production these would be fetched
  // from environment variables or a backend service
  return {
    // Weaviate connection details
    weaviate: {
      url: "https://1hsyybfpqouabtfuyxidg.c0.europe-west3.gcp.weaviate.cloud",
      apiKey: "Q2sQTPxMp8UMuNCRuDec4o50O1OZ6zKl5OwO",
      openAIKey: "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",
    },
    
    // API timeout configuration (in milliseconds)
    apiTimeout: 30000, // 30 seconds
  };
};

// Helper function to check if we're in a development environment
export const isDevelopment = () => {
  return import.meta.env.DEV || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';
};

/**
 * IMPORTANT: In a real production environment, this would be replaced
 * with a secure backend service call that would fetch secrets without
 * exposing them in the frontend code.
 */
