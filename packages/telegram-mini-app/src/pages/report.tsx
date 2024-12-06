import { AlertCircle, Check, ExternalLink, Shield } from "lucide-react";
import { UnifiedReport } from "./types";

export const SecurityReport = ({ report }: { report: UnifiedReport }) => {
  const getRiskColor = (score: number) => {
    if (score < 30) return "bg-green-500";
    if (score < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Security Analysis Report
            </h1>
          </div>
          <a
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm"
          >
            {report.url}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Screenshot */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Visual Capture
          </h2>
          <img
            src={report.screenshotBase64}
            alt="Website Screenshot"
            className="w-full rounded-lg border border-gray-200"
          />
        </div>

        {/* Content Analysis */}
        <div className="grid gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              Content Analysis
            </h2>

            <div className="space-y-6">
              {/* Purpose */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Purpose</h3>
                <p className="text-gray-700">
                  {report.contentAnalysis.purpose}
                </p>
              </div>

              {/* Risk Score */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Risk Assessment
                </h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getRiskColor(report.contentAnalysis.riskScore)}`}
                        style={{
                          width: `${report.contentAnalysis.riskScore}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-gray-900 text-sm">
                      {report.contentAnalysis.riskScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Risks */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Potential Risks
                </h3>
                <ul className="space-y-2">
                  {report.contentAnalysis.risks.map((risk, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-gray-800 bg-red-50 p-2 rounded"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Topics & Audience */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Main Topics
                  </h3>
                  <ul className="space-y-2">
                    {report.contentAnalysis.mainTopics.map((topic, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-gray-700"
                      >
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Target Audience
                  </h3>
                  <p className="text-gray-700">
                    {report.contentAnalysis.targetAudience}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Redirect Chain */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              Redirect Analysis
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-blue-50 p-3 rounded-lg">
                <span className="font-semibold text-gray-900">
                  Total Redirects:
                </span>
                <span className="text-gray-700">
                  {report.securityData.redirects.totalRedirects}
                </span>
              </div>

              <div className="space-y-3">
                {report.securityData.redirects.chain.map((redirect, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                        {redirect.type.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded text-gray-800">
                        {redirect.statusCode}
                      </span>
                    </div>
                    <a
                      href={redirect.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm break-all flex items-center gap-1"
                    >
                      {redirect.url}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
