import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, AlertCircle } from "lucide-react";

const LEGAL_PAGES = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
  { id: "contact", label: "Contact Us" }
];

export default function AdminLegal() {
  const [activeTab, setActiveTab] = useState("privacy");
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
          toast.error("Unauthorized access");
          base44.auth.redirectToLogin(window.location.href);
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  const { data: pages = [], isLoading: isPagesLoading } = useQuery({
    queryKey: ['legal-pages-admin'],
    queryFn: () => base44.entities.LegalPage.list(),
    enabled: !!user
  });

  // Update form data when tab changes or data loads
  useEffect(() => {
    const page = pages.find(p => p.slug === activeTab);
    if (page) {
      setFormData({
        title: page.title,
        content: page.content
      });
    } else {
      // Defaults
      const defaults = {
        privacy: { title: "Privacy Policy", content: "# Privacy Policy\n\nWrite your policy here..." },
        terms: { title: "Terms of Service", content: "# Terms of Service\n\nWrite your terms here..." },
        contact: { title: "Contact Us", content: "# Contact Us\n\nFor support, email us..." }
      };
      setFormData(defaults[activeTab] || { title: "", content: "" });
    }
  }, [activeTab, pages]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const existingPage = pages.find(p => p.slug === activeTab);
      if (existingPage) {
        return base44.entities.LegalPage.update(existingPage.id, {
          title: data.title,
          content: data.content,
          last_updated: new Date().toISOString()
        });
      } else {
        return base44.entities.LegalPage.create({
          slug: activeTab,
          title: data.title,
          content: data.content,
          last_updated: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-pages-admin'] });
      queryClient.invalidateQueries({ queryKey: ['legal-pages'] });
      toast.success("Page saved successfully");
    },
    onError: () => {
      toast.error("Failed to save page");
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isAuthChecking || isPagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Legal Pages CMS</h1>
          <p className="text-slate-600">Manage your policy pages content</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            {LEGAL_PAGES.map(page => (
              <TabsTrigger key={page.id} value={page.id} className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                {page.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Card className="p-6 bg-white shadow-sm border-slate-200">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Content (Markdown)</Label>
                  <a 
                    href="https://www.markdownguide.org/cheat-sheet/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <AlertCircle className="h-3 w-3" /> Markdown Help
                  </a>
                </div>
                <Textarea 
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Enter your content here using Markdown..."
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button 
                  onClick={handleSave} 
                  disabled={saveMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}