import { OpenAIClient } from "@/lib/openai-client";
import {
  Dns,
  DomainAge,
  RedirectAnalysis,
  RiskAssessment,
  SecurityAnalysisInput,
  SSLInfo,
} from "@/types";

export class AIRiskAnalyzer {
  constructor(private ai: OpenAIClient) {}

  public async analyze(data: SecurityAnalysisInput): Promise<RiskAssessment> {
    const analysisPrompt = `
      Analyze the following website security data and provide a comprehensive risk assessment.
      Focus on identifying potential security risks, trust signals, and provide actionable recommendations.

      REDIRECT ANALYSIS:
      ${this.formatRedirectData(data.redirects)}

      DNS CONFIGURATION:
      ${this.formatDnsData(data.dns)}

      DOMAIN AGE:
      ${this.formatDomainAge(data.domainAge)}

      SSL CERTIFICATE:
      ${this.formatSSLData(data.ssl)}

      Analyze these security indicators and return a JSON response with the following structure:
      {
        "riskScore": number between 0-100 (higher means riskier),
        "riskLevel": "LOW" | "MEDIUM" | "HIGH",
        "findings": [detailed list of security findings],
        "redFlags": [concerning security indicators],
        "trustIndicators": [positive security signals],
        "recommendations": [actionable security recommendations],
        "technicalDetails": {
          "redirectAnalysis": {
            "suspiciousRedirects": boolean,
            "crossDomainRedirects": boolean,
            "redirectChainLength": number
          },
          "dnsAnalysis": {
            "hasSPF": boolean,
            "hasMX": boolean,
            "hasSecurityVerifications": boolean,
            "geolocationRisk": "LOW" | "MEDIUM" | "HIGH"
          },
          "domainAnalysis": {
            "ageRisk": "LOW" | "MEDIUM" | "HIGH",
            "verificationMethod": "WHOIS" | "DNS Fallback" | "UNKNOWN"
          },
          "sslAnalysis": {
            "isValid": boolean,
            "issuerTrust": "LOW" | "MEDIUM" | "HIGH",
            "expiryRisk": "LOW" | "MEDIUM" | "HIGH"
          }
        }
      }

      Risk Analysis Guidelines:

      Domain Analysis:
      1. Domain age risk levels:
        - <6 months: HIGH risk
        - 6-12 months: MEDIUM risk
        - >1 year: LOW risk
      2. Wildcard domains: Slightly increase risk

      SSL Analysis:
      3. SSL certificates:
        - Known CAs (Let's Encrypt, DigiCert): MEDIUM-LOW risk
        - Unknown/expired: HIGH risk

      DNS Security:
        4. Email security (SPF, MX): Proper configuration decreases risk
        5. Security verifications in TXT records: Presence decreases risk
        6. Hosting location: High-risk regions increase risk

      Redirect Analysis:
      7. Safe redirect patterns:
        - HTTP → HTTPS + www redirects: Positive security signal
        - Same-domain/subdomain redirects: Safe unless >5 hops
        - CDN/cloud provider redirects: Trusted
      8. Risky redirect patterns:
        - Cross-domain: Risk only if different root domains
        - Redirect risk hierarchy: HTTP 301/302 (safe) → 307/308 → JS → Meta refresh (risky)
        - Suspicious indicators: IP redirects, mixed TLDs, uncommon ports, circular redirects
    `;

    const { content: result, error } = await this.ai.createCompletion(
      analysisPrompt,
      {
        temperature: 0.2,
        maxTokens: 1500,
      }
    );

    if (error || !result) {
      return this.getDefaultAssessment();
    }

    try {
      const assessment = JSON.parse(result);
      return this.validateAssessment(assessment);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e);
      return this.getDefaultAssessment();
    }
  }

  private formatRedirectData(redirects: RedirectAnalysis | null): string {
    if (!redirects) return "Redirect analysis data unavailable";

    const chain = redirects.chain
      .map((r) => {
        const parts = [];
        if (r.url) parts.push(`URL: ${r.url}`);
        if (r.statusCode) parts.push(`Status: ${r.statusCode}`);
        if (r.type) parts.push(`Type: ${r.type}`);
        return parts.join("\n          ");
      })
      .filter(Boolean)
      .join("\n");

    const parts = [];
    if (chain) parts.push(`- Redirect Chain:\n        ${chain}`);
    if (redirects.finalUrl) parts.push(`- Final URL: ${redirects.finalUrl}`);
    if (typeof redirects.totalRedirects === "number") {
      parts.push(`- Total Redirects: ${redirects.totalRedirects}`);
    }

    return parts.join("\n") || "No redirect data available";
  }

  private formatDnsData(dns: Dns | null): string {
    if (!dns) return "DNS analysis data unavailable";

    const parts = [];

    // Add error information if present
    if (dns.result.status === "error" && dns.result.error) {
      parts.push(`- DNS Resolution: Failed (${dns.result.error.type})`);
      parts.push(`- Error Details: ${dns.result.error.message}`);
    }

    // Location info
    if (dns.ipGeolocationInfo?.[0]?.geoInfo) {
      const geo = dns.ipGeolocationInfo[0].geoInfo;
      const location = [];
      if (geo.country_name) location.push(geo.country_name);
      if (geo.city) location.push(geo.city);
      if (location.length) {
        parts.push(`- Hosting Location: ${location.join(", ")}`);
      }
    }

    // MX Records
    if (dns.mxRecords?.length) {
      const mxRecords = dns.mxRecords
        .map((mx) => mx.exchange)
        .filter(Boolean)
        .join(", ");
      if (mxRecords) parts.push(`- MX Records: ${mxRecords}`);
    }

    // Security TXT Records
    if (dns.txtRecords?.length) {
      const securityTxt = dns.txtRecords
        .flat()
        .filter(
          (txt) =>
            txt &&
            (txt.includes("spf1") ||
              txt.includes("verification") ||
              txt.includes("domain-verification"))
        );
      if (securityTxt.length) {
        parts.push(`- Security TXT Records: ${securityTxt.join("\n")}`);
      }
    }

    // Wildcard info
    if (typeof dns.isWildcardDomain === "boolean") {
      parts.push(`- Wildcard Domain: ${dns.isWildcardDomain}`);
    }

    return parts.join("\n") || "No DNS data available";
  }

  private formatDomainAge(domainAge: DomainAge | null): string {
    if (!domainAge) return "Domain age information unavailable";

    const parts = [];
    if (typeof domainAge.age === "number") {
      parts.push(`- Age: ${domainAge.age} years`);
    }
    if (domainAge.creationDate) {
      parts.push(`- Creation Date: ${domainAge.creationDate}`);
    }
    if (domainAge.method) {
      parts.push(`- Verification Method: ${domainAge.method}`);
    }

    return parts.join("\n") || "Limited domain age data available";
  }

  private formatSSLData(ssl: SSLInfo | null): string {
    if (!ssl) return "SSL certificate information unavailable";

    const parts = [];
    if (typeof ssl.valid === "boolean") {
      parts.push(`- Valid: ${ssl.valid}`);
    }
    if (ssl.issuer) {
      parts.push(`- Issuer: ${ssl.issuer}`);
    }
    if (ssl.validFrom) {
      parts.push(`- Valid From: ${ssl.validFrom}`);
    }
    if (ssl.validTo) {
      parts.push(`- Valid To: ${ssl.validTo}`);
    }
    if (typeof ssl.daysRemaining === "number") {
      parts.push(`- Days Until Expiration: ${ssl.daysRemaining}`);
    }

    return parts.join("\n") || "Limited SSL data available";
  }

  private validateAssessment(assessment: any): RiskAssessment {
    // Basic validation with default values
    const validated: RiskAssessment = {
      riskScore: Math.min(Math.max(Number(assessment.riskScore) || 0, 0), 100),
      riskLevel: this.validateRiskLevel(assessment.riskLevel),
      findings: Array.isArray(assessment.findings) ? assessment.findings : [],
      redFlags: Array.isArray(assessment.redFlags) ? assessment.redFlags : [],
      trustIndicators: Array.isArray(assessment.trustIndicators)
        ? assessment.trustIndicators
        : [],
      recommendations: Array.isArray(assessment.recommendations)
        ? assessment.recommendations
        : [],
      technicalDetails: {
        redirectAnalysis: {
          suspiciousRedirects: Boolean(
            assessment.technicalDetails?.redirectAnalysis?.suspiciousRedirects
          ),
          crossDomainRedirects: Boolean(
            assessment.technicalDetails?.redirectAnalysis?.crossDomainRedirects
          ),
          redirectChainLength:
            Number(
              assessment.technicalDetails?.redirectAnalysis?.redirectChainLength
            ) || 0,
        },
        dnsAnalysis: {
          hasSPF: Boolean(assessment.technicalDetails?.dnsAnalysis?.hasSPF),
          hasMX: Boolean(assessment.technicalDetails?.dnsAnalysis?.hasMX),
          hasSecurityVerifications: Boolean(
            assessment.technicalDetails?.dnsAnalysis?.hasSecurityVerifications
          ),
          geolocationRisk: this.validateRiskLevel(
            assessment.technicalDetails?.dnsAnalysis?.geolocationRisk
          ),
        },
        domainAnalysis: {
          ageRisk: this.validateRiskLevel(
            assessment.technicalDetails?.domainAnalysis?.ageRisk
          ),
          verificationMethod: this.validateVerificationMethod(
            assessment.technicalDetails?.domainAnalysis?.verificationMethod
          ),
        },
        sslAnalysis: {
          isValid: Boolean(assessment.technicalDetails?.sslAnalysis?.isValid),
          issuerTrust: this.validateRiskLevel(
            assessment.technicalDetails?.sslAnalysis?.issuerTrust
          ),
          expiryRisk: this.validateRiskLevel(
            assessment.technicalDetails?.sslAnalysis?.expiryRisk
          ),
        },
      },
    };

    return validated;
  }

  private validateRiskLevel(level: any): "LOW" | "MEDIUM" | "HIGH" {
    const validLevels = ["LOW", "MEDIUM", "HIGH"];
    return validLevels.includes(String(level).toUpperCase())
      ? (String(level).toUpperCase() as "LOW" | "MEDIUM" | "HIGH")
      : "MEDIUM";
  }

  private validateVerificationMethod(
    method: any
  ): "WHOIS" | "DNS Fallback" | "UNKNOWN" {
    const validMethods = ["WHOIS", "DNS Fallback"];
    return validMethods.includes(String(method).toUpperCase())
      ? (String(method).toUpperCase() as "WHOIS" | "DNS Fallback")
      : "UNKNOWN";
  }

  private getDefaultAssessment(): RiskAssessment {
    return {
      riskScore: -1,
      riskLevel: "MEDIUM",
      findings: ["Risk assessment could not be performed"],
      redFlags: ["Analysis service temporarily unavailable"],
      trustIndicators: [],
      recommendations: [
        "Try analysis again later",
        "Perform manual security review",
      ],
      technicalDetails: {
        redirectAnalysis: {
          suspiciousRedirects: false,
          crossDomainRedirects: false,
          redirectChainLength: 0,
        },
        dnsAnalysis: {
          hasSPF: false,
          hasMX: false,
          hasSecurityVerifications: false,
          geolocationRisk: "MEDIUM",
        },
        domainAnalysis: {
          ageRisk: "MEDIUM",
          verificationMethod: "UNKNOWN",
        },
        sslAnalysis: {
          isValid: false,
          issuerTrust: "MEDIUM",
          expiryRisk: "MEDIUM",
        },
      },
    };
  }
}
