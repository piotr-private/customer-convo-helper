
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
