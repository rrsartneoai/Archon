import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, FileText, Brain, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    type: 'snippet' | 'document' | 'transcription';
    relevance: number;
  }>;
}

interface RAGInterfaceProps {
  documentContext?: {
    type: 'transcription' | 'document';
    id: string;
    title?: string;
  };
}

const RAGInterface: React.FC<RAGInterfaceProps> = ({ documentContext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock funkcja - w produkcji połączyć z backendem/Supabase Edge Functions
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Mock odpowiedź AI
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Na podstawie analizy dostępnych dokumentów prawnych mogę odpowiedzieć na Twoje pytanie: "${inputValue}". 

W kontekście polskiego prawa, należy zwrócić uwagę na następujące aspekty:

1. **Regulacje prawne** - Zgodnie z obowiązującymi przepisami...
2. **Orzecznictwo** - Sądy wielokrotnie orzekały w podobnych sprawach...
3. **Praktyka prawna** - W praktyce kancelarii zaleca się...

Czy chciałbyś, żebym rozwinął któryś z tych punktów?`,
        timestamp: new Date(),
        sources: [
          { title: 'Klauzula RODO - Zgoda na przetwarzanie danych', type: 'snippet', relevance: 0.95 },
          { title: 'Postanowienia umowy najmu - waloryzacja', type: 'snippet', relevance: 0.87 },
          { title: 'Transkrypcja rozprawy z 2024-01-15', type: 'transcription', relevance: 0.72 }
        ]
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Jakie są kluczowe klauzule w umowie najmu?",
    "Jak prawidłowo sformułować zgodę RODO?",
    "Kiedy można zastosować waloryzację czynszu?",
    "Jakie są zasady odpowiedzialności kontraktowej?"
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <Card className="glass-effect">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary animate-neural-pulse" />
            <span className="text-gradient">Asystent RAG</span>
            {documentContext && (
              <span className="text-sm text-muted-foreground ml-auto">
                Kontekst: {documentContext.title || `${documentContext.type} ${documentContext.id}`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="glass-effect h-[500px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-float" />
              <h3 className="text-lg font-medium mb-2">Witaj w Asystencie RAG</h3>
              <p className="text-muted-foreground mb-6">
                Zadaj pytanie, a przeszukam całą bazę wiedzy prawnej
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start hover-scale"
                    onClick={() => setInputValue(question)}
                  >
                    <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] space-y-2`}>
                    <div
                      className={`flex items-start gap-2 ${
                        message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground animate-neural-pulse'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div
                        className={`p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'glass-effect border'
                        } animate-scale-in`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs mt-2 opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="ml-10 space-y-1">
                        <div className="text-xs text-muted-foreground">Źródła:</div>
                        {message.sources.map((source, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs p-2 bg-background/30 rounded border hover-scale cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span className="flex-1">{source.title}</span>
                            <span className="text-muted-foreground">
                              {(source.relevance * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="flex items-start gap-2">
                      <div className="p-2 bg-secondary text-secondary-foreground rounded-full animate-neural-pulse">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="glass-effect border p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          <span className="text-sm text-muted-foreground ml-2">Analizuję dokumenty...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Zadaj pytanie prawne..."
              className="flex-1 p-3 bg-background/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={2}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              variant="gradient"
              size="lg"
              className="self-end hover-scale"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RAGInterface;