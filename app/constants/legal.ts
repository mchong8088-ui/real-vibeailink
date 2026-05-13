// Legal disclaimer data for the application

export const disclaimerData = {
  title: "Legal Disclaimer",
  content: `
    <h2>Important Information</h2>
    <p>The information provided by vibeAiLink ("we," "us," or "our") on our platform is for general informational purposes only. All information on the site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the site.</p>
    
    <h3>Not Financial Advice</h3>
    <p>The information provided does not constitute financial advice, investment advice, trading advice, or any other type of advice. You should not treat any of the platform's content as a substitute for professional financial advice. Always conduct your own research and consult with a qualified financial advisor before making any investment decisions.</p>
    
    <h3>Risk Warning</h3>
    <p>Trading stocks and other financial instruments involves significant risk of loss. Past performance is not indicative of future results. You should never invest money that you cannot afford to lose. We are not responsible for any financial losses you may incur as a result of using our platform.</p>
    
    <h3>Third-Party Links</h3>
    <p>Our platform may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites.</p>
    
    <h3>Limitation of Liability</h3>
    <p>In no event shall vibeAiLink be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of or inability to use our platform.</p>
    
    <h3>Changes to This Disclaimer</h3>
    <p>We may update this disclaimer from time to time. We will notify you of any changes by posting the new disclaimer on this page. You are advised to review this disclaimer periodically for any changes.</p>
    
    <h3>Contact Us</h3>
    <p>If you have any questions about this disclaimer, please contact us at support@vibeailink.com.</p>
  `,
  lastUpdated: new Date().toISOString().split('T')[0],
  version: "1.0.0"
};

// Also export individual sections if needed
export const disclaimerSections = [
  {
    title: "Important Information",
    content: "The information provided by vibeAiLink ('we', 'us', or 'our') on our platform is for general informational purposes only."
  },
  {
    title: "Not Financial Advice",
    content: "The information provided does not constitute financial advice, investment advice, trading advice, or any other type of advice."
  },
  {
    title: "Risk Warning",
    content: "Trading stocks and other financial instruments involves significant risk of loss. Past performance is not indicative of future results."
  },
  {
    title: "Third-Party Links",
    content: "Our platform may contain links to third-party websites or services that are not owned or controlled by us."
  },
  {
    title: "Limitation of Liability",
    content: "In no event shall vibeAiLink be liable for any direct, indirect, incidental, special, consequential, or punitive damages."
  }
];

export const termsOfService = {
  title: "Terms of Service",
  version: "1.0.0",
  lastUpdated: new Date().toISOString().split('T')[0],
  sections: [
    {
      title: "Acceptance of Terms",
      content: "By accessing and using vibeAiLink, you accept and agree to be bound by the terms and provisions of this agreement."
    },
    {
      title: "Use License",
      content: "Permission is granted to temporarily use the platform for personal, non-commercial transitory viewing only."
    },
    {
      title: "Disclaimer",
      content: "The materials on vibeAiLink are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights."
    },
    {
      title: "Limitations",
      content: "In no event shall vibeAiLink or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the platform."
    },
    {
      title: "Revisions and Errata",
      content: "The materials appearing on vibeAiLink could include technical, typographical, or photographic errors. We do not warrant that any of the materials on its platform are accurate, complete, or current."
    },
    {
      title: "Governing Law",
      content: "Any claim relating to vibeAiLink shall be governed by the laws of the jurisdiction without regard to its conflict of law provisions."
    }
  ]
};
