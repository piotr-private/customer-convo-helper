
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HistoricalEmail } from '@/services/weaviateService';

interface HistoricalQuestionsProps {
  emails: HistoricalEmail[];
}

const HistoricalQuestions: React.FC<HistoricalQuestionsProps> = ({ emails }) => {
  if (emails.length === 0) return null;

  // Format a date string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="w-full glass-card mt-6 animate-slide-up">
      <CardHeader>
        <CardTitle className="text-2xl font-medium">Similar Historical Questions</CardTitle>
        <CardDescription>
          Previous customer conversations on similar topics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {emails.map((email) => (
          <Card key={email.id} className="overflow-hidden animate-hover border border-border/50">
            <div className="bg-secondary/40 p-3 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-medium">{email.properties.customer_name}</span>
                <span className="text-sm text-muted-foreground">{email.properties.customer_email}</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
                  {formatDate(email.properties.date)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
                  {Math.round((1 - email.metadata.distance) * 100)}% match
                </span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm whitespace-pre-line">{email.properties.content}</p>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default HistoricalQuestions;
