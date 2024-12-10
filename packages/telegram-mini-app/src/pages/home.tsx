import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { WelcomeScreen } from "./intro";
import { SecurityReport } from "./report";
import { UnifiedReport } from "./types";

export const Home = () => {
  const startParam = new URLSearchParams(window.location.search).get("url");

  const [report, setReport] = useState<UnifiedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!startParam) {
          throw new Error("No URL provided");
        }

        const response = await fetch(startParam);

        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }

        const data = await response.json();

        const base64Image = `data:image/png;base64,${data.screenshotBase64}`;
        setReport({ ...data, screenshotBase64: base64Image });
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (startParam) {
      fetchReport();
    }
  }, [startParam]);

  if (!startParam) {
    return <WelcomeScreen />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return <SecurityReport report={report} />;
};
