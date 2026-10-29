// Terms of use and Privacy policy — the text of hellorobo.co/terms-of-use and
// hellorobo.co/privacy-policy. Paragraphs the old site had pasted twice by accident are kept
// once, the second "13." is 14, and doubled full stops are single.

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  /** label / value lines, e.g. the contact details; values starting with mailto:/https: link */
  lines?: { label?: string; value: string; href?: string }[];
};

export const terms: LegalSection[] = [
  {
    title: 'Acceptance of Terms',
    paragraphs: [
      'By accessing, browsing, or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy. We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of the Services after any changes constitutes your acceptance of the revised Terms.',
    ],
  },
  {
    title: 'Description of service',
    paragraphs: [
      'Hello Robo Inc. is a design agency specializing in design services for robotics companies. Our Services may include, but are not limited to, branding, product design, user experience design, web design, and related creative and strategic consulting services. The specific scope of services for any engagement will be defined in a separate agreement or statement of work between you and Hello Robo Inc.',
    ],
  },
  {
    title: 'Eligibility',
    paragraphs: [
      'You must be at least 18 years of age or the age of majority in your jurisdiction to use our Services. By using our Services, you represent and warrant that you meet these eligibility requirements and have the legal capacity to enter into these Terms.',
    ],
  },
  {
    title: 'Intellectual Property Rights',
    paragraphs: [
      'All content, materials, trademarks, logos, designs, text, graphics, images, and other intellectual property displayed on or through our Services are the property of Hello Robo Inc. or its licensors and are protected by applicable intellectual property laws. You may not reproduce, distribute, modify, create derivative works from, publicly display, or otherwise exploit any content from our Services without our prior written consent.',
      'For client work, intellectual property ownership and usage rights will be governed by the specific terms outlined in the applicable client agreement or statement of work.',
    ],
  },
  {
    title: 'User Conduct',
    paragraphs: ['When using our Services, you agree not to:'],
    list: [
      '(a) Use the Services for any unlawful purpose or in violation of any applicable laws or regulations;',
      '(b) Infringe upon or violate the intellectual property rights or any other rights of others;',
      '(c) Transmit any harmful, threatening, abusive, defamatory, or otherwise objectionable content;',
      '(d) Attempt to gain unauthorized access to any portion of the Services or any related systems or networks;',
      '(e) Use any automated means, including bots, scrapers, or spiders, to access or collect data from our Services;',
      '(f) Interfere with or disrupt the integrity or performance of the Services.',
    ],
  },
  {
    title: 'Third-Party Links',
    paragraphs: [
      'Our Services may contain links to third-party websites or services that are not owned or controlled by Hello Robo Inc. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that Hello Robo Inc. shall not be responsible or liable for any damage or loss caused by your use of any such third-party content.',
    ],
  },
  {
    title: 'Disclaimer of Warranties',
    paragraphs: [
      'The Services are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. Hello Robo Inc. does not warrant that the Services will be uninterrupted, error-free, or secure, or that any defects will be corrected.',
    ],
  },
  {
    title: 'Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by applicable law, in no event shall Hello Robo Inc., its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of profits, data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the Services; (b) any conduct or content of any third party on the Services; or (c) unauthorized access, use, or alteration of your transmissions or content.',
    ],
  },
  {
    title: 'Indemnification',
    paragraphs: [
      'You agree to defend, indemnify, and hold harmless Hello Robo Inc., its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Services, your violation of these Terms, or your violation of any rights of a third party.',
    ],
  },
  {
    title: 'Governing Law',
    paragraphs: [
      'These Terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any disputes arising from or related to these Terms or your use of the Services shall be resolved exclusively in the courts located in the State of New York.',
    ],
  },
  {
    title: 'Termination',
    paragraphs: [
      'We may terminate or suspend your access to the Services immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.',
    ],
  },
  {
    title: 'Severability',
    paragraphs: [
      'If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.',
    ],
  },
  {
    title: 'Entire Agreement',
    paragraphs: [
      'These Terms, together with our Privacy Policy and any other legal notices or agreements published by Hello Robo Inc. on the Services, constitute the entire agreement between you and Hello Robo Inc. concerning the Services.',
    ],
  },
  {
    title: 'Contact Information',
    paragraphs: ['If you have any questions about these Terms of Use, please contact us at:'],
    lines: [
      { value: 'Hello Robo Inc.' },
      { label: 'Website', value: 'https://www.hellorobo.co', href: 'https://www.hellorobo.co' },
      { label: 'Email', value: 'hello@hellorobo.co', href: 'mailto:hello@hellorobo.co' },
    ],
  },
];

export const privacy: LegalSection[] = [
  {
    title: 'What we collect',
    paragraphs: [
      'Hello Robo collects personal information — including your name, email address, job title, and company name — when you fill out forms on our website or engage with our marketing campaigns on platforms like LinkedIn.',
    ],
  },
  {
    title: 'How we use it',
    paragraphs: [
      'We use this information to communicate with you about our design services, share relevant research and insights, and respond to inquiries. We may also use it to improve our marketing efforts.',
    ],
  },
  {
    title: 'Storage',
    paragraphs: ['Your data is stored securely and retained only as long as necessary for the purposes described in this policy.'],
  },
  {
    title: 'Your rights',
    paragraphs: ['You can request access to, correction of, or deletion of your personal data at any time. Just reach out — we’ll take care of it.'],
  },
  {
    title: 'Contact',
    paragraphs: ['For any privacy-related requests or questions, contact us at:'],
    lines: [{ value: 'info@hellorobo.co', href: 'mailto:info@hellorobo.co' }],
  },
];
