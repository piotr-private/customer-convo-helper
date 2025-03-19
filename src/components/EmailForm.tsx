
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface EmailFormProps {
  onSubmit: (email: string) => void;
  isLoading: boolean;
}

const EmailForm: React.FC<EmailFormProps> = ({ onSubmit, isLoading }) => {
  const [customerEmail, setCustomerEmail] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerEmail.trim()) {
      toast.error("Please enter a customer email");
      return;
    }
    
    onSubmit(customerEmail);
  };

  return (
    <Card className="w-full glass-card animate-in">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-medium">Customer Inquiry</CardTitle>
        <CardDescription>
          Enter the customer's email to get response suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              id="customerEmail"
              placeholder="Hi Cameron, we're already a B-Corp, is this any different?"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="min-h-[120px] resize-none border-0 bg-secondary/50 shadow-inner"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full transition-all duration-300 bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-pulse-subtle mr-2">Analyzing</div>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              "Get Response Suggestions"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EmailForm;
