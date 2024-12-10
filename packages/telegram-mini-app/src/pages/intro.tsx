import logo from "./logo.jpg";
import { PromoMessage } from "./promo";

export function WelcomeScreen() {
  const openBot = () => {
    window.open("https://t.me/browserguard_bot", "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <PromoMessage />
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg flex shrink-0">
              <img src={logo} alt="Browser Guard Bot" className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to Malwarebytes Browser Guard Bot! 👋
            </h1>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              I help protect Telegram users by analyzing links shared in chats
              and groups for potential security threats and scams. When someone
              shares a URL in a conversation, I'll:
            </p>

            <div className="grid gap-2 text-gray-600">
              <div className="flex items-center gap-2">
                <span>📸</span>
                <span>Send a preview screenshot of the website</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔍</span>
                <span>Analyze the site's content and purpose</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <span>Check SSL certificates and domain age</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🌐</span>
                <span>Verify DNS configurations and redirects</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>Identify potential security risks</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📊</span>
                <span>Generate a comprehensive security report</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-base font-semibold text-blue-900">
                You can use me in:
              </h3>
              <ul className="mt-2 space-y-2 text-blue-800">
                <li>• Direct messages: Just send a link</li>
                <li>• Groups: Add me and I'll analyze shared links</li>
                <li>
                  • Inline mode: Type{" "}
                  <a
                    href="https://t.me/browserguard_bot"
                    className="text-blue-600 hover:underline"
                  >
                    @browserguard_bot
                  </a>{" "}
                  in any chat followed by a URL
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={openBot}
            className="mt-8 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            Install Malwarebytes Browser Guard Bot
          </button>
        </div>
      </div>
    </div>
  );
}
