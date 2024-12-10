export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

// Redirects
export interface RedirectData {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  type: "http" | "js" | "meta";
}

export interface RedirectAnalysis {
  chain: RedirectData[];
  finalUrl: string;
  totalRedirects: number;
}

// // DNS / IP Geolocation
export type GeoInfo = {
  ip: string;
  continent_code?: string;
  continent_name?: string;
  country_code2: string;
  country_code3: string;
  country_name: string;
  country_name_official: string;
  city: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  is_eu: false;
  geoname_id: string;
  isp?: string;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
};

export type IpGeolocationResponse = {
  geoInfo: GeoInfo;
};

export type DnsError = {
  message: string;
  type: "NXDOMAIN" | "SERVFAIL" | "TIMEOUT" | "UNKNOWN";
};

export type DnsResult = {
  status: "success" | "error";
  error?: DnsError;
};

export type Dns = {
  ipGeolocationInfo: IpGeolocationResponse[];
  txtRecords: string[][];
  mxRecords: Array<{
    exchange: string;
    priority: number;
  }>;
  isWildcardDomain: boolean;
  result: DnsResult;
};

// Domain age
interface DomainDate {
  method: "WHOIS" | "DNS Fallback";
  creationDate: string;
  age: number;
}

export type DomainAge = DomainDate | null;

// SSL
export interface SSLInfo {
  validFrom: string | null;
  validTo: string | null;
  issuer: string | null;
  valid: boolean;
  daysRemaining: number;
  validationError?: string;
}

export type SSLInfoRawData = SSLInfo | null;

// Raw data analysis input
export interface SecurityAnalysisInput {
  redirects: RedirectAnalysis;
  dns: Dns;
  domainAge: DomainAge;
  ssl: SSLInfoRawData;
}

// AI Risk assessment
export interface RiskAssessment {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  findings: string[];
  redFlags: string[];
  trustIndicators: string[];
  recommendations: string[];
  technicalDetails: {
    redirectAnalysis: {
      suspiciousRedirects: boolean;
      crossDomainRedirects: boolean;
      redirectChainLength: number;
    };
    dnsAnalysis: {
      hasSPF: boolean;
      hasMX: boolean;
      hasSecurityVerifications: boolean;
      geolocationRisk: "LOW" | "MEDIUM" | "HIGH";
    };
    domainAnalysis: {
      ageRisk: "LOW" | "MEDIUM" | "HIGH";
      verificationMethod: "WHOIS" | "DNS Fallback" | "UNKNOWN";
    };
    sslAnalysis: {
      isValid: boolean;
      issuerTrust: "LOW" | "MEDIUM" | "HIGH";
      expiryRisk: "LOW" | "MEDIUM" | "HIGH";
    };
  };
}

// Report
export interface TrustSignals {
  isMajorBrand: boolean;
  hasProperLegal: boolean;
  professionalContent: boolean;
  properNavigation: boolean;
  appropriateSecurity: boolean;
}

export interface RiskFactors {
  credentialRequests: boolean;
  dataCollection: boolean;
  urgencyTactics: boolean;
  suspiciousElements: boolean;
  poorQuality: boolean;
}

export interface ContentAnalysis {
  purpose: string;
  risks: string[];
  isScam: boolean;
  riskScore: number;
  trustSignals: TrustSignals;
  riskFactors: RiskFactors;
}

export interface UnifiedReport {
  url: string;
  timestamp: number;
  screenshotBase64: string;
  contentAnalysis: ContentAnalysis | null;
  securityData: SecurityAnalysisInput;
  securityAnalysis: RiskAssessment;
}
