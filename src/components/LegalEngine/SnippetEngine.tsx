import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, Eye, Edit, Trash2, Download, Upload } from 'lucide-react';

interface Snippet {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  lastModified: string;
  author: string;
  version: string;
  status: 'draft' | 'approved' | 'archived';
}

interface SnippetEngineProps {
  lawFirmId?: string;
}

const SnippetEngine: React.FC<SnippetEngineProps> = ({ lawFirmId }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - w produkcji połączyć z Supabase
  const mockSnippets: Snippet[] = [
    {
      id: '1',
      title: 'Klauzula RODO - Zgoda na przetwarzanie danych',
      category: 'Ochrona Danych',
      content: 'Wyrażam zgodę na przetwarzanie moich danych osobowych zgodnie z art. 6 ust. 1 lit. a) RODO...',
      tags: ['RODO', 'zgoda', 'dane osobowe'],
      lastModified: '2024-01-15',
      author: 'Anna Kowalska',
      version: '2.1',
      status: 'approved'
    },
    {
      id: '2',
      title: 'Postanowienia umowy najmu - waloryzacja',
      category: 'Prawo Nieruchomości',
      content: 'Czynsz najmu ulega waloryzacji w oparciu o wskaźnik inflacji publikowany przez GUS...',
      tags: ['najem', 'waloryzacja', 'inflacja'],
      lastModified: '2024-01-10',
      author: 'Jan Nowak',
      version: '1.3',
      status: 'approved'
    },
    {
      id: '3',
      title: 'Klauzula odpowiedzialności - szkody materialne',
      category: 'Prawo Gospodarcze',
      content: 'Strona ponosi odpowiedzialność za szkody materialne powstałe z jej winy...',
      tags: ['odpowiedzialność', 'szkody', 'odszkodowanie'],
      lastModified: '2024-01-08',
      author: 'Maria Wiśniewska',
      version: '1.0',
      status: 'draft'
    }
  ];

  useEffect(() => {
    setSnippets(mockSnippets);
  }, []);

  const categories = ['all', 'Ochrona Danych', 'Prawo Nieruchomości', 'Prawo Gospodarcze', 'Prawo Pracy'];

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         snippet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'draft': return 'text-yellow-400';
      case 'archived': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gradient">Snippet Engine</h2>
          <p className="text-muted-foreground mt-2">Zarządzaj biblioteką klauzul prawnych</p>
        </div>
        <div className="flex gap-2">
          <Button variant="neural" className="hover-scale">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="gradient" className="hover-scale">
            <Plus className="w-4 h-4 mr-2" />
            Nowa Klauzula
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Szukaj klauzul, tagów, treści..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Wszystkie kategorie' : category}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Łączna liczba', value: snippets.length, color: 'text-blue-400' },
          { label: 'Zatwierdzone', value: snippets.filter(s => s.status === 'approved').length, color: 'text-green-400' },
          { label: 'Robocze', value: snippets.filter(s => s.status === 'draft').length, color: 'text-yellow-400' },
          { label: 'Zarchiwizowane', value: snippets.filter(s => s.status === 'archived').length, color: 'text-gray-400' }
        ].map((stat, index) => (
          <Card key={index} className="glass-effect hover-scale transition-all duration-300">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSnippets.map((snippet) => (
          <Card key={snippet.id} className="glass-effect hover-scale transition-all duration-300 hover:neural-glow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight">{snippet.title}</CardTitle>
                <div className={`text-xs font-medium ${getStatusColor(snippet.status)}`}>
                  {snippet.status.toUpperCase()}
                </div>
              </div>
              <div className="text-sm text-accent">{snippet.category}</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {snippet.content}
              </p>
              
              <div className="flex flex-wrap gap-1">
                {snippet.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>Autor: {snippet.author}</div>
                <div>Wersja: {snippet.version} | {snippet.lastModified}</div>
              </div>

              <div className="flex justify-between gap-2 pt-2">
                <Button variant="ghost" size="sm" className="hover-scale">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="hover-scale">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="hover-scale">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="hover-scale text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSnippets.length === 0 && (
        <Card className="glass-effect">
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Brak wyników</h3>
            <p className="text-muted-foreground">
              Nie znaleziono klauzul pasujących do kryteriów wyszukiwania.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SnippetEngine;