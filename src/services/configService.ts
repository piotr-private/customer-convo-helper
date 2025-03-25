
import { getServiceCredentials, getFallbackCredentials } from './apiCredentialsService';

// Configuration cache to avoid unnecessary DB calls
let configCache: Record<string, any> = {};

/**
 * Get environment configuration with appropriate defaults
 * This approach allows for future expansion to fetch from backend
 */
export const getConfig = () => {
  // Return cached config if available
  if (Object.keys(configCache).length > 0) {
    return configCache;
  }
  
  // Default configuration
  const defaultConfig = {
    // Weaviate connection details (fallback values)
    weaviate: {
      url: "https://1hsyybfpqouabtfuyxidg.c0.europe-west3.gcp.weaviate.cloud",
      apiKey: "", // Will be populated from Supabase
      openAIKey: "", // Will be populated from Supabase
    },
    
    // API timeout configuration (in milliseconds)
    apiTimeout: 30000, // 30 seconds
  };
  
  // Cache and return the config
  configCache = defaultConfig;
  return configCache;
};

/**
 * Refreshes the configuration by fetching the latest values from Supabase
 * This should be called when the application starts or when config changes are needed
 */
export const refreshConfig = async (): Promise<void> => {
  try {
    console.log("Refreshing application configuration from Supabase");
    
    // Get Weaviate credentials from Supabase
    const weaviateCredentials = await getServiceCredentials('weaviate');
    
    if (weaviateCredentials) {
      // Update the config cache with values from Supabase
      configCache.weaviate = {
        url: "https://1hsyybfpqouabtfuyxidg.c0.europe-west3.gcp.weaviate.cloud",
        apiKey: weaviateCredentials.api_key,
        openAIKey: weaviateCredentials.additional_keys.openai_key || "",
      };
      
      console.log("Configuration updated successfully from Supabase");
    } else {
      // Try to use fallback credentials
      const fallbackCredentials = getFallbackCredentials('weaviate');
      
      if (fallbackCredentials) {
        configCache.weaviate = {
          url: "https://1hsyybfpqouabtfuyxidg.c0.europe-west3.gcp.weaviate.cloud",
          apiKey: fallbackCredentials.api_key,
          openAIKey: fallbackCredentials.additional_keys.openai_key || "",
        };
        
        console.warn("Using fallback configuration because Supabase data couldn't be retrieved");
      } else {
        console.error("Failed to get weaviate credentials from Supabase and no fallback is available");
      }
    }
  } catch (error) {
    console.error("Error refreshing configuration:", error);
  }
};

// Helper function to check if we're in a development environment
export const isDevelopment = () => {
  return import.meta.env.DEV || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';
};
