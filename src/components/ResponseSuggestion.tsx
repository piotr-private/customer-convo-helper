
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { EmailResponse } from '@/services/weaviateService';

interface ResponseSuggestionProps {
  response: EmailResponse | null;
}

const ResponseSuggestion: React.FC<ResponseSuggestionProps> = ({ response }) => {
  if (!response) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(response.answer);
    toast.success("Response copied to clipboard");
  };

  return (
    <Card className="w-full glass-card mt-6 animate-slide-up">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-medium">Suggested Response</CardTitle>
            <CardDescription>
              Based on your previous communications
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleCopy}
          >
            <Copy size={14} />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-secondary/40 p-4 rounded-md">
          <p className="whitespace-pre-line text-foreground">{response.answer}</p>
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Source Email</h4>
          <p className="text-sm text-muted-foreground bg-secondary/40 p-3 rounded-md">
            {response.source}
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Justification</h4>
          <p className="text-sm text-muted-foreground bg-secondary/40 p-3 rounded-md">
            {response.justification}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResponseSuggestion;
