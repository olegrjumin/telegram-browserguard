import getSSLInfo from "./data-retrieval";
import evaluateSSLRisk from "./risk";

const sslAnalysis = async (url: string) => {
  try {
    const sslInfo = await getSSLInfo(url);
    if (!sslInfo) {
      return { sslRisk: "HIGH" };
    }
    const sslRisk = evaluateSSLRisk(sslInfo);

    return {
      sslRisk,
    };
  } catch (error: unknown) {
    console.error(error);
    return { sslRisk: "INCONCLUSIVE" };
  }
};
export default sslAnalysis;
