
import React, { useState } from 'react';
import EmailForm from './EmailForm';
import ResponseSuggestion from './ResponseSuggestion';
import HistoricalQuestions from './HistoricalQuestions';
import { getResponseSuggestion, EmailResponse, HistoricalEmail } from '@/services/weaviateService';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CustomerConvoHelper: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<EmailResponse | null>(null);
  const [historicalEmails, setHistoricalEmails] = useState<HistoricalEmail[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (customerEmail: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Submitting customer email for processing");
      const result = await getResponseSuggestion(customerEmail);
      
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      
      setResponse(result.response);
      setHistoricalEmails(result.historicalEmails);
      
      if (!result.response && result.historicalEmails.length === 0) {
        toast.warning("No relevant responses found. Try being more specific.");
      } else {
        toast.success("Response generated successfully");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
