import { toast } from "sonner";
import { getConfig, refreshConfig, isDevelopment } from "./configService";

// Response types
export interface EmailResponse {
  answer: string;
  source: string;
  justification: string;
}

export interface HistoricalEmail {
  id: string;
  properties: {
    customer_name?: string;
    customer_email?: string;
    content?: string;
    replying_to?: string;
    my_reply?: string;
    category?: string;
    date?: string;
  };
  metadata: {
    distance: number;
  };
}

// Generate mock data for demonstration purposes
// This function simulates the response we would get from Weaviate
const generateMockResponse = (customerEmail: string): {
  response: EmailResponse;
  historicalEmails: HistoricalEmail[];
} => {
  console.log("Generating mock response for:", customerEmail);
  
  // Simulated response based on the customer email
  const response: EmailResponse = {
    answer: `Hi there,\n\nThanks for reaching out! I understand you have a question about ${customerEmail.includes('@') ? 'your account' : customerEmail}.\n\nWe definitely can help with that. Based on similar questions we've handled before, I recommend checking out our FAQ section or I can walk you through the solution directly.\n\nLet me know if you need any additional information or have other questions!\n\nBest regards,\nFilip`,
    source: "Previous email to Cameron about product features",
    justification: "I maintained the friendly tone and direct approach from previous communications. I acknowledged the customer's question and offered both self-service and direct assistance options, which is consistent with the communication style in similar past emails."
  };
  
  // Generate some realistic-looking historical emails
  const historicalEmails: HistoricalEmail[] = [
    {
      id: "email1",
      properties: {
        customer_name: "John Smith",
        customer_email: "john.smith@example.com",
        my_reply: "Hi John, thanks for your question about our product features. We do offer what you're looking for, and I'd be happy to schedule a demo to show you how it works. Let me know what time works best for you!",
        category: "Having question or objection",
        replying_to: "I'm wondering if your platform has export capabilities for data analysis?",
        date: "2025-01-15T14:23:00Z"
      },
      metadata: {
        distance: 0.15
      }
    },
    {
      id: "email2",
      properties: {
        customer_name: "Sarah Johnson",
        customer_email: "sarah.j@company.org",
        my_reply: "Hello Sarah, I understand your concern about pricing. Our premium plan does include all the features you mentioned, and there are no hidden fees. I've attached a detailed comparison sheet for your reference. Feel free to reach out if you have any other questions!",
        category: "Having question or objection",
        replying_to: "Are there any hidden fees in your premium plan?",
        date: "2025-02-03T09:15:00Z"
      },
      metadata: {
        distance: 0.25
      }
    },
    {
      id: "email3",
      properties: {
        customer_name: "Michael Chen",
        customer_email: "mchen@techfirm.co",
        my_reply: "Hi Michael, regarding your question about integration capabilities - yes, our platform can integrate with the software you're currently using. We use standard APIs for most integrations, and I'm happy to connect you with our technical team to discuss the specific requirements for your setup.",
        category: "Having question or objection",
        replying_to: "Does your product integrate with our existing CRM solution?",
        date: "2025-02-18T16:45:00Z"
      },
      metadata: {
        distance: 0.35
      }
    }
  ];
  
  return { response, historicalEmails };
};

// Initialize Weaviate client connection
const initWeaviateClient = async () => {
  console.log("Initializing Weaviate client connection configuration");
  
  // Try to refresh the config to ensure we have the latest from Supabase
  await refreshConfig();
  
  // Get configuration
  const config = getConfig().weaviate;
  
  // Check if we have the required API keys
  if (!config.apiKey || !config.openAIKey) {
    console.error("Missing Weaviate or OpenAI API keys");
    throw new Error("Failed to initialize Weaviate client: Missing API keys");
  }
  
  // Return the configuration that will be used for requests
  return {
    baseUrl: config.url,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'X-OpenAI-Api-Key': config.openAIKey,
      'Content-Type': 'application/json'
    }
  };
};

// Get a preconfigured client for requests
const getWeaviateClient = (() => {
  // Use closure to maintain a single client configuration
  let clientConfig: any = null;
  let clientPromise: Promise<any> | null = null;
  
  return async () => {
    if (!clientConfig) {
      // If we don't have a client config yet, but have a pending promise, wait for it
      if (clientPromise) {
        try {
          clientConfig = await clientPromise;
          return clientConfig;
        } catch (error) {
          // If the pending promise fails, set to null so we can retry
          clientPromise = null;
          throw error;
        }
      }
      
      // Initialize the client config
      clientPromise = initWeaviateClient();
      try {
        clientConfig = await clientPromise;
      } catch (error) {
        console.error("Failed to initialize Weaviate client:", error);
        clientPromise = null;
        throw error;
      }
    }
    return clientConfig;
  };
})();

// Timeout promise for fetch operations
const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit, timeoutMs: number = 30000): Promise<Response> => {
  // Create an abort controller to handle timeout
  const controller = new AbortController();
  
  // Ensure timeout is a valid number
  const validTimeoutMs = typeof timeoutMs === 'number' && !isNaN(timeoutMs) ? timeoutMs : 30000;
  
  // Set up the timeout
  const timeoutId = setTimeout(() => {
    console.log(`Request timed out after ${validTimeoutMs}ms`);
    controller.abort();
  }, validTimeoutMs);
  
  try {
    // Include the abort signal with the fetch options
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    
    // Clear the timeout if the request completes normally
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    // Clear the timeout to prevent memory leaks
    clearTimeout(timeoutId);
    
    // Re-throw the error
    throw error;
  }
};

export async function getResponseSuggestion(customerEmail: string): Promise<{
  response: EmailResponse | null;
  historicalEmails: HistoricalEmail[];
  error?: string;
  usingMockData?: boolean;
}> {
  try {
    console.log("Getting response suggestion for:", customerEmail);
    
    // Get client configuration
    const client = await getWeaviateClient();
    
    // Get timeout configuration with fallback
    let API_TIMEOUT = getConfig().apiTimeout || 30000; // Default to 30 seconds if config value is undefined
    console.log(`Using API timeout: ${API_TIMEOUT}ms`);
    
    // Format the task for the LLM
    const task = `Edit the following examples of my past communication into one email that is a good response to this email from my potential client: ${customerEmail}

Whenever possible, use THE EXACT phrases from my past communication. I want the response to be AS SIMILAR AS POSSIBLE to what I wrote in the past, while answering the email from my potential client accurately.
Return an answer in a following format:
{
"answer": Your proposition of the reply I should send to a customer as a string,
"source": most similar email used for the response,
"justification": provide your thought process behind making changes to the email suggested, compared to "used_emails" list. As stated previously, avoid paraphrases and every paraphrase should have a solid justification.
}`;

    // Make the API call to Weaviate with extended timeout
    console.log(`Making request to Weaviate GraphQL endpoint (${client.baseUrl}) with ${API_TIMEOUT}ms timeout`);
    
    try {
      const response = await fetchWithTimeout(`${client.baseUrl}/v1/graphql`, {
        method: 'POST',
        headers: client.headers,
        mode: 'cors', 
        body: JSON.stringify({
          query: `
            {
              Get {
                Filip2(
                  nearText: {
                    concepts: ["""${customerEmail.replace(/"/g, '\\"')}"""]
                    distance: 0.75
                  }
                  limit: 5
                ) {
                  replying_to
                  my_reply
                  category
                  _additional {
                    id
                    distance
                    generate(
                      singleResult: {
                        prompt: """${task.replace(/"/g, '\\"')} use {my_reply} to base your answers on"""
                      }
                    ) {
                      singleResult
                    }
                  }
                }
              }
            }
          `
        })
      }, API_TIMEOUT);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data from Weaviate:", data);
      
      // Extract the generated response
      const generatedResponseJson = data?.data?.Get?.Filip2?.[0]?._additional?.generate?.singleResult;
      let generatedResponse: EmailResponse | null = null;
      
      console.log("Generated response JSON:", generatedResponseJson);
      
      if (generatedResponseJson) {
        try {
          // Try parsing it as JSON first
          if (generatedResponseJson.startsWith('{') && generatedResponseJson.endsWith('}')) {
            generatedResponse = JSON.parse(generatedResponseJson);
          } else {
            throw new Error("Response is not in JSON format");
          }
        } catch (parseError) {
          console.error("Failed to parse generated response:", parseError);
          console.log("Raw response:", generatedResponseJson);
          
          // Try to extract response in a more forgiving way if it's not valid JSON
          // This is a fallback mechanism to handle malformed responses
          try {
            if (generatedResponseJson.includes('"answer"') && 
                generatedResponseJson.includes('"source"') && 
                generatedResponseJson.includes('"justification"')) {
              
              // Extract parts using regex patterns
              const answerMatch = /"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/;
              const sourceMatch = /"source"\s*:\s*"((?:[^"\\]|\\.)*)"/;
              const justificationMatch = /"justification"\s*:\s*"((?:[^"\\]|\\.)*)"/;
              
              generatedResponse = {
                answer: (answerMatch.exec(generatedResponseJson)?.[1] || "").replace(/\\"/g, '"'),
                source: (sourceMatch.exec(generatedResponseJson)?.[1] || "").replace(/\\"/g, '"'),
                justification: (justificationMatch.exec(generatedResponseJson)?.[1] || "").replace(/\\"/g, '"')
              };
            } else {
              // Fallback to a simple response
              generatedResponse = {
                answer: "I've processed your query but couldn't format a proper response. Please try again with different wording.",
                source: "Generated response",
                justification: "The response format from the AI system was unexpected and couldn't be properly parsed."
              };
            }
          } catch (fallbackError) {
            console.error("Even fallback parsing failed:", fallbackError);
            generatedResponse = {
              answer: "Sorry, I couldn't generate a proper response. Please try again.",
              source: "Error",
              justification: "Failed to parse the AI response."
            };
          }
        }
      }

      // Extract historical emails
      const historicalEmails: HistoricalEmail[] = data?.data?.Get?.Filip2?.map((email: any) => ({
        id: email._additional.id,
        properties: {
          customer_name: "Customer",
          customer_email: "customer@example.com",
          replying_to: email.replying_to || "",
          my_reply: email.my_reply || "",
          category: email.category || "",
          date: new Date().toISOString()
        },
        metadata: {
          distance: email._additional.distance
        }
      })) || [];

      console.log("Processed historical emails:", historicalEmails.length);

      return {
        response: generatedResponse,
        historicalEmails,
        usingMockData: false
      };
    } catch (fetchError) {
      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching from Weaviate:", error);
    
    // Check if this is a timeout error
    const isTimeoutError = error instanceof DOMException && error.name === "AbortError";
    if (isTimeoutError) {
      console.log("Request timed out after waiting for LLM response");
      toast.error("Request timed out waiting for the AI response. Try again with a simpler query.");
      return {
        response: null,
        historicalEmails: [],
        error: "The AI took too long to respond. Please try again with a simpler query.",
        usingMockData: false
      };
    }
    
    // Check if this is a CORS error
    const isCORSError = error instanceof TypeError && 
                       (error.message.includes("Failed to fetch") || 
                        error.message.includes("NetworkError") || 
                        error.message.includes("Network request failed"));
    
    if (isCORSError) {
      console.log("CORS error detected, falling back to mock data");
      toast.error("CORS policy prevented API access, using demo data instead");
      
      // Return mock data as fallback when there's a CORS error
      // Fallback to mock data only if there's a real error
      const mockData = generateMockResponse(customerEmail);
      
      return {
        response: mockData.response,
        historicalEmails: mockData.historicalEmails,
        usingMockData: true
      };
    }
    
    // For other errors, return a more specific error message
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    toast.error(`Error: ${errorMessage}`);
    
    // Fallback to mock data for any error in production
    const mockData = generateMockResponse(customerEmail);
    
    return {
      response: mockData.response,
      historicalEmails: mockData.historicalEmails,
      error: errorMessage,
      usingMockData: true
    };
  }
}
