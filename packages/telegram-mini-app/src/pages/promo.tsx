import { useEffect, useState } from "react";

const promoMessages = [
  `Malwarebytes is Product of the Year by AV Lab. <a class="text-blue-600 underline" href='https://www.malwarebytes.com/getprotection'>Download for free</a>`,
  `Malwarebytes Browser Guard is a free browser extension. <a class="text-blue-600 underline" href='https://www.malwarebytes.com/browserguard'>Get protected for free</a>`,
  `Malwarebytes shares free tips about how to stay safe via e-mail. <a class="text-blue-600 underline" href='https://www.malwarebytes.com/newsletter'>Sign up today for free</a>`,
  `For the latest news and tips to stay safe. <a class="text-blue-600 underline" href='https://www.facebook.com/Malwarebytes'>Follow Malwarebytes on Facebook</a>`,
  `For the most recent updates and advice on staying safe. <a class="text-blue-600 underline" href='https://www.linkedin.com/company/malwarebytes'>Join Malwarebytes on LinkedIn</a>`,
  `For the latest updates and digital safety tips. <a class="text-blue-600 underline" href='https://twitter.com/malwarebytes'>Follow Malwarebytes on X (formerly Twitter)</a>`,
  `Find out what personal info has been leaked with Malwarebytes' free Digital Footprint Scan. <a class="text-blue-600 underline" href='https://www.malwarebytes.com/digital-footprint'>Check now for free</a>`,
  `Find out if your personal info might be leaked with Malwarebytes' free Personal Data Remover. <a class="text-blue-600 underline" href='https://www.malwarebytes.com/personal-data-remover'>Clean it up for free</a>`,
];

export const PromoMessage = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const randomMessage =
      promoMessages[Math.floor(Math.random() * promoMessages.length)];
    setMessage(randomMessage);
  }, []);

  return (
    <div
      className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4 text-blue-800 text-xs"
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
};
