import { Toast } from "@/components/ui/toast";

// Weaviate connection details
const WCD_URL = "https://1hsyybfpqouabtfuyxidg.c0.europe-west3.gcp.weaviate.cloud";
const WCD_API_KEY = "Q2sQTPxMp8UMuNCRuDec4o50O1OZ6zKl5OwO";
const OPENAI_KEY = "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";

// API timeout configuration (in milliseconds) - 30 seconds
const API_TIMEOUT = 30000;

// Response types
export interface EmailResponse {
  answer: string;
  source: string;
  justification: string;
}

export interface HistoricalEmail {
  id: string;
  properties: {
    customer_email: string;
    customer_name: string;
    date: string;
    content: string;
    category: string;
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
        customer_email: "john.smith@example.com",
        customer_name: "John Smith",
        date: "2025-02-15",
        content: "Hi John, thanks for your question about our product features. We do offer what you're looking for, and I'd be happy to schedule a demo to show you how it works. Let me know what time works best for you!",
        category: "Having question or objection"
      },
      metadata: {
        distance: 0.15
      }
    },
    {
      id: "email2",
      properties: {
        customer_email: "sarah.jones@example.com",
        customer_name: "Sarah Jones",
        date: "2025-01-28",
        content: "Hello Sarah, I understand your concern about pricing. Our premium plan does include all the features you mentioned, and there are no hidden fees. I've attached a detailed comparison sheet for your reference. Feel free to reach out if you have any other questions!",
        category: "Having question or objection"
      },
      metadata: {
        distance: 0.25
      }
    },
    {
      id: "email3",
      properties: {
        customer_email: "michael.brown@example.com",
        customer_name: "Michael Brown",
        date: "2025-03-05",
        content: "Hi Michael, regarding your question about integration capabilities - yes, our platform can integrate with the software you're currently using. We use standard APIs for most integrations, and I'm happy to connect you with our technical team to discuss the specific requirements for your setup.",
        category: "Having question or objection"
      },
      metadata: {
        distance: 0.35
      }
    }
  ];
  
  return { response, historicalEmails };
};

// Initialize Weaviate client connection
const initWeaviateClient = () => {
  console.log("Initializing Weaviate client connection configuration");
  
  // Return the configuration that will be used for requests
  return {
    baseUrl: WCD_URL,
    headers: {
      'Authorization': `Bearer ${WCD_API_KEY}`,
      'X-OpenAI-Api-Key': OPENAI_KEY,
      'Content-Type': 'application/json'
    }
  };
};

// Get a preconfigured client for requests
const getWeaviateClient = (() => {
  // Use closure to maintain a single client configuration
  let clientConfig: ReturnType<typeof initWeaviateClient> | null = null;
  
  return () => {
    if (!clientConfig) {
      clientConfig = initWeaviateClient();
    }
    return clientConfig;
  };
})();

// Timeout promise for fetch operations
const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  
  clearTimeout(id);
  return response;
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
    const client = getWeaviateClient();
    
    // Format the task for the LLM
    const task = `Based on the following examples of my previous communication, reply to this email: '${customerEmail}'

Do it by adjusting the examples of my previous communication. Focus on mimicking my communication style, phrases, and tone of voice.

Don't paraphrase my sentences if not needed. Avoid words that are typical for AI-generated content (e.g, enhance, additionally, moreover, essential, dazzling, dive into, foster, etc.)

Return an answer in a following format:
{
"answer": Your proposition of the reply I should send to a customer as a string,
"source": most similar email used for the response,
"justification": provide your thought process behind making changes to the email suggested, compared to "used_emails" list. As stated previously, avoid paraphrases and every paraphrase should have a solid justification.
}`;

    // Make the API call to Weaviate with extended timeout
    console.log("Making request to Weaviate GraphQL endpoint with extended timeout");
    const response = await fetchWithTimeout(`${client.baseUrl}/v1/graphql`, {
      method: 'POST',
      headers: client.headers,
      mode: 'cors', 
      body: JSON.stringify({
        query: `
          {
            Get {
              Filip(
                nearText: {
                  concepts: ["${customerEmail.replace(/"/g, '\\"')}"]
                  targetVectors: ["replying_to_vector"]
                }
                where: {
                  path: ["category"]
                  operator: Equal
                  valueText: "Having question or objection"
                }
                limit: 4
              ) {
                _additional {
                  id
                  distance
                  generate(
                    singlePrompt: """${task}"""
                  ) {
                    singleResult
                  }
                }
                properties {
                  customer_email
                  customer_name
                  date
                  content
                  category
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
    const generatedResponse = data?.data?.Get?.Filip?.[0]?._additional?.generate?.singleResult;

    // Extract historical emails
    const historicalEmails: HistoricalEmail[] = data?.data?.Get?.Filip?.map((email: any) => ({
      id: email._additional.id,
      properties: {
        customer_email: email.properties.customer_email,
        customer_name: email.properties.customer_name,
        date: email.properties.date,
        content: email.properties.content,
        category: email.properties.category
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
    
    return {
      response: null,
      historicalEmails: [],
      error: errorMessage,
      usingMockData: false
    };
  }
}
