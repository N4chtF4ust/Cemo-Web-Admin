const sections = [
  {
    title: "1. Information We Collect",
    content:
      "Depending on the features you use, CEMO may collect information such as your email address, account identifiers, information you submit through the app, and technical information needed to operate, maintain, and secure the service.",
  },
  {
    title: "2. How We Use Your Information",
    content:
      "Information may be used to create and manage your account, provide app features, respond to support requests, process account deletion requests, maintain security, prevent misuse, and comply with applicable legal obligations.",
  },
  {
    title: "3. Data Storage and Security",
    content:
      "CEMO may use Firebase Authentication, Google Apps Script, and associated Google services to support account management and application functions. Appropriate measures are taken to protect information against unauthorized access, loss, misuse, or disclosure. However, no method of electronic storage or transmission is completely secure.",
  },
  {
    title: "4. Sharing of Information",
    content:
      "CEMO does not sell your personal information. Information may be processed by service providers that help operate the application, or disclosed when required by law or when necessary to protect the rights, safety, and security of users and the service.",
  },
  {
    title: "5. Data Retention",
    content:
      "Personal information is retained only for as long as necessary to provide the service, fulfill legitimate operational needs, resolve disputes, meet legal obligations, and protect the security of the application. Retention periods may vary depending on the type of information.",
  },
  {
    title: "6. Account and Data Deletion",
    content:
      "You may request deletion of your CEMO account and associated personal information using the account deletion form on this page. Requests may be verified before processing. Some information may be retained where required or permitted by applicable law or for legitimate security purposes.",
  },
  {
    title: "7. Your Privacy Rights",
    content:
      "Depending on applicable law, you may have the right to request access to, correction of, or deletion of your personal information, and to raise concerns about how your information is handled. Contact the CEMO developer to submit a privacy request.",
  },
  {
    title: "8. Children's Privacy",
    content:
      "CEMO's practices regarding children's information should comply with applicable privacy laws. If you believe a child has provided personal information inappropriately, contact the CEMO developer to request a review.",
  },
  {
    title: "9. Changes to This Policy",
    content:
      "This Privacy Policy may be updated from time to time to reflect changes to the application, its data practices, or applicable legal requirements. The updated version will be published with a revised effective date.",
  },
  {
    title: "10. Contact Us",
    content:
      "For questions about this Privacy Policy, your personal information, or your privacy rights, contact the CEMO developer using the official support contact provided for the application.",
  },
];

export function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-900 dark:bg-gray-950 dark:text-zinc-100 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:p-10">
        <header className="border-b border-zinc-200 pb-8 dark:border-white/10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cemo-primary">
            CEMO
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Effective date: October 26, 2026
          </p>
        </header>

        <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          <p>
            CEMO respects your privacy and is committed to protecting your personal information.
            This Privacy Policy explains how information may be collected, used, stored, and
            protected when you use the CEMO application.
          </p>

          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-base font-bold text-zinc-900 dark:text-white">
                {section.title}
              </h2>
              <p>{section.content}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
