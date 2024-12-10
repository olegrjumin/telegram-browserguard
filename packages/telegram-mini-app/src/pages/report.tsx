import { AlertCircle, Check, ExternalLink, Server, Shield } from "lucide-react";
import logo from "./logo.jpg";
import { PromoMessage } from "./promo";
import type { UnifiedReport } from "./types";

const Badge = ({
  color,
  children,
  label,
}: {
  color: string;
  children: React.ReactNode;
  label?: string;
}) => (
  <div className="flex flex-col items-end gap-1">
    {label && <span className="text-xs text-gray-500">{label}</span>}
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${color} text-nowrap`}
    >
      {children}
    </span>
  </div>
);

const RiskCard = ({
  label,
  level,
  color,
}: {
  label: string;
  level: string;
  color: string;
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 flex items-center justify-between w-full">
    <div className="flex items-center gap-3">
      <Shield className="w-5 h-5 text-gray-400" />
      <span className="text-gray-600 font-medium">{label}</span>
    </div>
    <div
      className={`px-2 py-1 rounded text-xs font-medium ${color} text-nowrap`}
    >
      {level}
    </div>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 mb-4">
    {title && (
      <h2 className="text-xl font-semibold mb-4 text-gray-900">{title}</h2>
    )}
    {children}
  </div>
);

const URLLink = ({ url }: { url: string }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm group max-w-full"
    >
      <span className="break-all">{url}</span>
      <ExternalLink className="w-4 h-4 flex-shrink-0" />
    </a>
  );
};

const HeaderTitle = ({ report }: { report: UnifiedReport }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg flex shrink-0">
          <img src={logo} alt="Browser Guard Bot" className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-gray-900">
          Malwarebytes Browser Guard Report
        </h1>
      </div>
      <URLLink url={report.url} />
    </div>
  );
};

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

  const getContentRiskLevel = (score: number) => {
    if (score < 30) return "LOW";
    if (score < 70) return "MEDIUM";
    return "HIGH";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-2 px-1">
      <div className="container mx-auto max-w-4xl">
        <PromoMessage />
        {/* Header */}
        <Section title="">
          <div className="space-y-4">
            {/* Title and URL */}
            <HeaderTitle report={report} />

            {/* Risk Cards */}
            <div className="space-y-2 flex flex-col lg:space-y-0 lg:space-x-1 lg:flex-row">
              <RiskCard
                label="Content Risk"
                level={getContentRiskLevel(report.contentAnalysis.riskScore)}
                color={getRiskBadgeColor(
                  getContentRiskLevel(report.contentAnalysis.riskScore),
                )}
              />
              <RiskCard
                label="Technical Risk"
                level={report.securityAnalysis.riskLevel}
                color={getRiskBadgeColor(report.securityAnalysis.riskLevel)}
              />
            </div>
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
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <Badge
                    color={getRiskBadgeColor(
                      getContentRiskLevel(report.contentAnalysis.riskScore),
                    )}
                  >
                    {getContentRiskLevel(report.contentAnalysis.riskScore)} RISK
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Score: {report.contentAnalysis.riskScore}/100
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

            {/* Topics & Audience Compact Display */}
            {false && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Main Topics
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {report.contentAnalysis.mainTopics.map((topic, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Target Audience
                  </h3>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    {report.contentAnalysis.targetAudience}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Security Analysis */}
        {report.securityData &&
          (report.securityAnalysis.findings.length > 0 ||
            report.securityAnalysis.redFlags.length > 0) && (
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
