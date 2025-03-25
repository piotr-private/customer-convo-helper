
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Interface for the API credentials stored in Supabase
 */
export interface ApiCredential {
  id: string;
  service_name: string;
  api_key: string;
  additional_keys: {
    openai_key?: string;
    [key: string]: string | undefined;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Fetch credentials for a specific service from Supabase
 */
export async function getServiceCredentials(serviceName: string): Promise<ApiCredential | null> {
  try {
    console.log(`Fetching credentials for service: ${serviceName}`);
    
    const { data, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('service_name', serviceName)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching ${serviceName} credentials:`, error);
      toast.error(`Failed to fetch API credentials: ${error.message}`);
      return null;
    }
    
    if (!data) {
      console.warn(`No credentials found for service: ${serviceName}`);
      return null;
    }
    
    console.log(`Successfully retrieved credentials for ${serviceName}`);
    return data as ApiCredential;
  } catch (error) {
    console.error(`Unexpected error when fetching ${serviceName} credentials:`, error);
    toast.error(`An unexpected error occurred when fetching API credentials`);
    return null;
  }
}

/**
 * Fallback configuration in case the API is unreachable
 * Only for development purposes - in production all keys should be in Supabase
 */
export function getFallbackCredentials(serviceName: string): ApiCredential | null {
  // This should only be used in development as a last resort
  console.warn(`Using fallback credentials for ${serviceName} - this should only happen in development`);
  
  if (serviceName === 'weaviate') {
    return {
      id: 'fallback',
      service_name: 'weaviate',
      api_key: 'Q2sQTPxMp8UMuNCRuDec4o50O1OZ6zKl5OwO',
      additional_keys: {
        openai_key: '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'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  
  return null;
}
