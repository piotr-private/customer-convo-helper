
import React, { useState } from 'react';
import EmailForm from './EmailForm';
import ResponseSuggestion from './ResponseSuggestion';
import HistoricalQuestions from './HistoricalQuestions';
import { getResponseSuggestion, EmailResponse, HistoricalEmail } from '@/services/weaviateService';
import { toast } from 'sonner';

const CustomerConvoHelper: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<EmailResponse | null>(null);
  const [historicalEmails, setHistoricalEmails] = useState<HistoricalEmail[]>([]);

  const handleSubmit = async (customerEmail: string) => {
    setIsLoading(true);
    try {
      const result = await getResponseSuggestion(customerEmail);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setResponse(result.response);
      setHistoricalEmails(result.historicalEmails);
      
      if (!result.response && result.historicalEmails.length === 0) {
        toast.warning("No relevant responses found. Try being more specific.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
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
      
      {response && <ResponseSuggestion response={response} />}
      
      {historicalEmails.length > 0 && <HistoricalQuestions emails={historicalEmails} />}
    </div>
  );
};

export default CustomerConvoHelper;
