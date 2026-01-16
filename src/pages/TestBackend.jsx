import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, Server } from "lucide-react";

export default function TestBackend() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('myBackend');
      setData(response.data);
    } catch (err) {
      setError(err.message || "Failed to call backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    callBackend();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Server className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Backend Test</h1>
            <p className="text-sm text-slate-500">Testing functions/myBackend.js</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-800 pb-2">
            <span>Response Output</span>
            {data && <span>{new Date().toLocaleTimeString()}</span>}
          </div>
          
          <div className="font-mono text-sm">
            {loading ? (
              <div className="flex items-center gap-2 text-indigo-400 py-8 justify-center">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Connecting to backend...</span>
              </div>
            ) : error ? (
              <div className="text-red-400 py-4">
                Error: {error}
              </div>
            ) : (
              <pre className="text-green-400 whitespace-pre-wrap break-all">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <Button 
          onClick={callBackend} 
          disabled={loading} 
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Run Function Again
        </Button>
      </Card>
    </div>
  );
}