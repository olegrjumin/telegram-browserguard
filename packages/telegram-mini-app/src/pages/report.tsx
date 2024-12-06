import { AlertCircle, Check, ExternalLink, Server, Shield } from "lucide-react";
import type { UnifiedReport } from "./types";

const Badge = ({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) => (
  <span
    className={`px-2 py-1 rounded text-xs font-medium ${color} text-nowrap
  `}
  >
    {children}
  </span>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mb-4">
    {title && (
      <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>
    )}
    {children}
  </div>
);

const InfoCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
    {children}
  </div>
);

export const SecurityReport = ({ report }: { report: UnifiedReport }) => {
  const getRiskColor = (score: number) => {
    if (score < 30) return "bg-green-500";
    if (score < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <Section title="">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Security Analysis Report
            </h1>
          </div>
          <div className="flex items-center justify-between space-x-2">
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm"
            >
              {report.url}
              <ExternalLink className="w-4 h-4" />
            </a>
            <Badge color={getRiskBadgeColor(report.securityAnalysis.riskLevel)}>
              {report.securityAnalysis.riskLevel} RISK
            </Badge>
          </div>
        </Section>

        {/* Screenshot */}
        <Section title="Visual Capture">
          <img
            src={report.screenshotBase64}
            alt="Website Screenshot"
            className="w-full rounded-lg border border-gray-200"
          />
        </Section>

        {/* Content Analysis */}
        <Section title="Content Analysis">
          <div className="space-y-6">
            {/* Purpose */}
            <InfoCard title="Purpose">
              <p className="text-gray-700">{report.contentAnalysis.purpose}</p>
            </InfoCard>

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
                      style={{ width: `${report.contentAnalysis.riskScore}%` }}
                    />
                  </div>
                  <span className="font-mono text-gray-900 text-sm">
                    {report.contentAnalysis.riskScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Risks */}
            {report.contentAnalysis.risks.length > 0 && (
              <InfoCard title="Potential Risks">
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
              </InfoCard>
            )}

            {/* Topics & Audience */}
            <div className="grid md:grid-cols-2 gap-6">
              <InfoCard title="Main Topics">
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
              </InfoCard>
              <InfoCard title="Target Audience">
                <p className="text-gray-700">
                  {report.contentAnalysis.targetAudience}
                </p>
              </InfoCard>
            </div>
          </div>
        </Section>

        {/* Security Analysis */}
        {report.securityData && (
          <>
            {/* Findings */}
            <Section title="Security Analysis">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Key Findings
                  </h3>
                  {report.securityAnalysis.findings.map((finding, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-blue-50 p-3 rounded"
                    >
                      <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-800">{finding}</span>
                    </div>
                  ))}
                </div>
                {report.securityAnalysis.redFlags.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Red Flags
                    </h3>
                    {report.securityAnalysis.redFlags.map((flag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-red-50 p-3 rounded"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-gray-800">{flag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            {/* Redirect Analysis */}
            {report.securityData.redirects.chain.length > 0 && (
              <Section title="Redirect Analysis">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 bg-blue-50 p-3 rounded">
                    <span className="font-semibold text-gray-900">
                      Total Redirects:
                    </span>
                    <span className="text-gray-800">
                      {report.securityData.redirects.totalRedirects}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {report.securityData.redirects.chain.map(
                      (redirect, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded border border-gray-200"
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
                      ),
                    )}
                  </div>
                </div>
              </Section>
            )}
          </>
        )}

        {/* Recommendations */}
        <Section title="Recommendations">
          <div className="space-y-3">
            {report.securityAnalysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-blue-50 p-3 rounded"
              >
                <Server className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span className="text-gray-800">{rec}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};
