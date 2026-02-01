export const metadata = {
  title: 'Tutoring',
  description:
    'Private and group tutoring services in Computer Science, History, and English.',
}

const subjects = [
  {
    name: 'Computer Science',
    description:
      'Build a strong foundation in programming and software development. I focus on practical, hands-on learning with real-world projects.',
    topics: [
      'Programming fundamentals',
      'Data structures & algorithms',
      'Web development',
      'Python & JavaScript',
      'Interview preparation',
    ],
  },
  {
    name: 'History',
    description:
      'Develop critical thinking and analytical skills through the study of historical events, movements, and primary sources.',
    topics: [
      'World history',
      'US history',
      'Research methods',
      'Essay writing',
      'Primary source analysis',
    ],
  },
  {
    name: 'English',
    description:
      'Strengthen your writing and communication skills. From grammar basics to advanced literary analysis and persuasive writing.',
    topics: [
      'Essay writing',
      'Reading comprehension',
      'Grammar & mechanics',
      'Literature analysis',
      'College application essays',
    ],
  },
]

function SubjectCard({
  subject,
}: {
  subject: {
    name: string
    description: string
    topics: string[]
  }
}) {
  return (
    <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {subject.name}
      </h2>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
        {subject.description}
      </p>

      <div>
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
          Topics Covered
        </h3>
        <ul className="space-y-1">
          {subject.topics.map((topic) => (
            <li
              key={topic}
              className="text-sm text-slate-600 dark:text-slate-400 flex items-center"
            >
              <span className="w-1.5 h-1.5 bg-primary-color rounded-full mr-2 flex-shrink-0" />
              {topic}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-3xl mb-4 tracking-tighter bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Tutoring Services
      </h1>

      <div className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl space-y-4">
        <p>
          I offer one-on-one and group tutoring sessions in Computer Science,
          History, and English for students from middle school through college.
          My approach is grounded in clear expectations and rigorous
          standards—not lowering the bar, but giving students the support they
          need to meet it.
        </p>
        <p>
          Whether you're mastering programming fundamentals, analyzing
          historical events, or crafting compelling essays, I focus on
          developing the critical thinking and discipline that transfer across
          every area of life. In an era where AI is reshaping how we work and
          learn, students need to understand these tools thoughtfully—not just
          how to use them, but when to use them, and how to wield them
          responsibly. My goal is to prepare students to engage with the world
          as capable, ethical citizens who can make a meaningful impact.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
        {subjects.map((subject) => (
          <SubjectCard key={subject.name} subject={subject} />
        ))}
      </div>

      <div className="text-center py-8 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-3">
          Ready to get started?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          Book a free consultation to discuss your goals and how I can help.
        </p>
        <a
          href="https://calendly.com/jamesimcdougalljr/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-primary-color hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
        >
          Book a Session
        </a>
      </div>
    </section>
  )
}
