
import React, { useState } from 'react';
import EmailForm from './EmailForm';
import ResponseSuggestion from './ResponseSuggestion';
import HistoricalQuestions from './HistoricalQuestions';
import { getResponseSuggestion, EmailResponse, HistoricalEmail } from '@/services/weaviateService';
import { toast } from 'sonner';
import { AlertCircle, Info, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CustomerConvoHelper: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<EmailResponse | null>(null);
  const [historicalEmails, setHistoricalEmails] = useState<HistoricalEmail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);

  const handleSubmit = async (customerEmail: string) => {
    setIsLoading(true);
    setError(null);
    setUsingMockData(false);
    setProcessingStartTime(Date.now());
    
    // Show processing toast that won't be automatically dismissed
    const processingToastId = toast.loading("Processing your query with AI. This may take up to 30 seconds...");
    
    try {
      console.log("Submitting customer email for processing");
      const result = await getResponseSuggestion(customerEmail);
      
      // Dismiss the processing toast
      toast.dismiss(processingToastId);
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      
      setResponse(result.response);
      setHistoricalEmails(result.historicalEmails);
      
      // Check if we're using mock data based on the API response
      setUsingMockData(result.usingMockData || false);
      
      if (!result.response && result.historicalEmails.length === 0) {
        toast.warning("No relevant responses found. Try being more specific.");
      } else {
        const processingTime = processingStartTime ? ((Date.now() - processingStartTime) / 1000).toFixed(1) : "?";
        toast.success(`Response generated in ${processingTime} seconds`);
      }
    } catch (error) {
      // Dismiss the processing toast
      toast.dismiss(processingToastId);
      
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setProcessingStartTime(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="mb-2 mt-2">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Customer Conversation Helper
        </div>
      </div>
      
      <h1 className="text-4xl font-medium tracking-tight mb-8 text-foreground">
        Get intelligent response suggestions
      </h1>
      
      <EmailForm onSubmit={handleSubmit} isLoading={isLoading} />
      
      {isLoading && (
        <Alert className="mt-6 bg-amber-50 border-amber-200">
          <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
          <AlertTitle className="text-amber-700">Processing</AlertTitle>
          <AlertDescription className="text-amber-600">
            The AI is analyzing your query and generating a response. This could take up to 30 seconds 
            as it searches for similar emails and crafts a personalized response.
          </AlertDescription>
        </Alert>
      )}
      
      {usingMockData && (
        <Alert className="mt-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700">Using Demo Mode</AlertTitle>
          <AlertDescription className="text-blue-600">
            Due to CORS restrictions, we're showing you sample data. In a real implementation, 
            this would be handled through a backend proxy or serverless function.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please try again or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      )}
      
      {response && <ResponseSuggestion response={response} />}
      
      {historicalEmails.length > 0 && <HistoricalQuestions emails={historicalEmails} />}
    </div>
  );
};

export default CustomerConvoHelper;
